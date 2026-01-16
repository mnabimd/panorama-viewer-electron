import { ipcMain, dialog } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { getProjectsDir, readProjectMetadata } from './file-utils';

/**
 * Register web export IPC handlers
 */
export function registerWebExportHandlers() {
  ipcMain.handle('export:web', handleExportWeb);
}

/**
 * Main export handler
 */
async function handleExportWeb(event: Electron.IpcMainInvokeEvent, projectId: string) {
  try {
    const project = await readProjectMetadata(projectId);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Show save dialog for ZIP file
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Project as Web App',
      defaultPath: `${project.name}.zip`,
      filters: [
        { name: 'ZIP Archive', extensions: ['zip'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export canceled' };
    }

    // Create temporary export directory
    const tempDir = path.join(process.cwd(), 'temp-export-' + Date.now());
    await fs.ensureDir(tempDir);

    try {
      // Report progress
      const reportProgress = (percentage: number, message: string) => {
        event.sender.send('export:progress', { percentage, message });
      };

      reportProgress(5, 'Preparing export...');

      // Copy template files
      await copyTemplateFiles(tempDir);
      reportProgress(10, 'Copying template files...');

      // Transform project data
      const transformedData = await transformProjectData(project, tempDir, reportProgress);
      reportProgress(75, 'Generating project.json...');

      // Write project.json
      const dataDir = path.join(tempDir, 'data');
      await fs.ensureDir(dataDir);
      await fs.writeJSON(path.join(dataDir, 'project.json'), transformedData, { spaces: 2 });

      // Create ZIP file
      reportProgress(80, 'Creating ZIP file...');
      await createZipArchive(tempDir, filePath, reportProgress);

      // Clean up temp directory
      reportProgress(98, 'Cleaning up...');
      await fs.remove(tempDir);

      reportProgress(100, 'Complete!');

      return { success: true, filePath };
    } catch (error) {
      // Clean up on error
      await fs.remove(tempDir).catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return { success: false, error: error.message || 'Export failed' };
  }
}

/**
 * Copy standalone template files to export directory
 */
async function copyTemplateFiles(exportDir: string) {
  const templateDir = path.join(process.cwd(), 'standalone-template');
  
  // Copy HTML
  await fs.copy(
    path.join(templateDir, 'index.html'),
    path.join(exportDir, 'index.html')
  );

  // Copy CSS
  const cssDir = path.join(exportDir, 'css');
  await fs.ensureDir(cssDir);
  await fs.copy(
    path.join(templateDir, 'css', 'styles.css'),
    path.join(cssDir, 'styles.css')
  );

  // Copy JS
  const jsDir = path.join(exportDir, 'js');
  await fs.ensureDir(jsDir);
  await fs.copy(
    path.join(templateDir, 'js', 'app.js'),
    path.join(jsDir, 'app.js')
  );

  // Copy README
  await fs.copy(
    path.join(templateDir, 'README.md'),
    path.join(exportDir, 'README.md')
  );

  // Copy launcher scripts
  const launchersDir = path.join(templateDir, 'launchers');
  
  // Copy Windows launcher
  await fs.copy(
    path.join(launchersDir, 'Start Project.bat'),
    path.join(exportDir, 'Start Project.bat')
  );
  
  // Copy Linux launcher
  const linuxLauncherDest = path.join(exportDir, 'linux_start.sh');
  await fs.copy(
    path.join(launchersDir, 'linux_start.sh'),
    linuxLauncherDest
  );
  
  // Make Linux launcher executable
  await fs.chmod(linuxLauncherDest, 0o755);
}

/**
 * Transform project data for standalone export
 */
async function transformProjectData(
  project: any,
  exportDir: string,
  reportProgress: (percentage: number, message: string) => void
) {
  const assetsDir = path.join(exportDir, 'assets');
  const thumbnailsDir = path.join(assetsDir, 'thumbnails');
  await fs.ensureDir(assetsDir);
  await fs.ensureDir(thumbnailsDir);

  const projectsDir = await getProjectsDir();
  const projectDir = path.join(projectsDir, project.id);
  const totalScenes = project.scenes?.length || 0;

  // Transform scenes
  const transformedScenes = await Promise.all(
    (project.scenes || []).map(async (scene: any, index: number) => {
      const sceneNum = index + 1;
      
      // Copy scene image
      reportProgress(
        20 + (30 * sceneNum / totalScenes),
        `Copying scene images ${sceneNum}/${totalScenes}...`
      );
      
      // scene.imagePath is an absolute path, use it directly
      const sourceImagePath = scene.imagePath;
      const imageFileName = `scene-${sceneNum}${path.extname(sourceImagePath)}`;
      const destImagePath = path.join(assetsDir, imageFileName);
      
      if (await fs.pathExists(sourceImagePath)) {
        await fs.copy(sourceImagePath, destImagePath);
      } else {
        console.warn(`[Export] Scene image not found: ${sourceImagePath}`);
      }

      // Copy thumbnail
      reportProgress(
        50 + (20 * sceneNum / totalScenes),
        `Copying thumbnails ${sceneNum}/${totalScenes}...`
      );
      
      let thumbnailPath = `./assets/thumbnails/scene-${sceneNum}-thumb${path.extname(sourceImagePath)}`;
      const destThumbnailPath = path.join(thumbnailsDir, `scene-${sceneNum}-thumb${path.extname(sourceImagePath)}`);
      
      try {
        if (scene.thumbnail && scene.thumbnail !== scene.imagePath) {
          // scene.thumbnail is also an absolute path
          const sourceThumbnailPath = scene.thumbnail;
          
          if (await fs.pathExists(sourceThumbnailPath)) {
            await fs.copy(sourceThumbnailPath, destThumbnailPath);
          } else if (await fs.pathExists(destImagePath)) {
            // Fallback: use scene image as thumbnail
            await fs.copy(destImagePath, destThumbnailPath);
          }
        } else if (await fs.pathExists(destImagePath)) {
          // Use scene image as thumbnail
          await fs.copy(destImagePath, destThumbnailPath);
        }
      } catch (error) {
        console.warn(`Failed to copy thumbnail for scene ${sceneNum}:`, error);
        // Continue without thumbnail
      }

      return {
        ...scene,
        imagePath: `./assets/${imageFileName}`,
        thumbnail: thumbnailPath,
      };
    })
  );

  // Return transformed project data
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    category: project.category,
    version: project.version || '1.0.0',
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString(),
    settings: project.settings,
    scenes: transformedScenes,
  };
}

/**
 * Create ZIP archive from export directory
 */
async function createZipArchive(
  sourceDir: string,
  zipPath: string,
  reportProgress: (percentage: number, message: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      reportProgress(95, 'ZIP file created');
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('progress', (progress) => {
      const percentage = 80 + Math.floor((progress.entries.processed / progress.entries.total) * 15);
      reportProgress(percentage, 'Creating ZIP file...');
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

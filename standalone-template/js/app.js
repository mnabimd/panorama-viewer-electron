/**
 * Panorama Viewer Standalone Application
 * Main application logic for the standalone panorama viewer
 */

// Global state
let viewer = null;
let markersPlugin = null;
let compassPlugin = null;
let projectData = null;
let currentSceneId = null;

/**
 * Initialize the application
 */
async function init() {
    try {
        // Load project data
        projectData = await loadProjectData();
        
        // Update UI with project info
        updateProjectInfo();
        
        // Initialize Photo Sphere Viewer
        initializeViewer();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load featured scene or first scene
        const featuredScene = projectData.scenes.find(s => s.isFeatured);
        const initialScene = featuredScene || projectData.scenes[0];
        
        if (initialScene) {
            loadScene(initialScene.id);
        }
        
        // Hide loading screen
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load panorama tour. Please check the console for details.');
    }
}

/**
 * Load project data from JSON file
 */
async function loadProjectData() {
    try {
        const response = await fetch('data/project.json');
        if (!response.ok) {
            throw new Error('Failed to load project data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading project data:', error);
        throw error;
    }
}

// Custom compass SVG with NEWS cardinal directions (matching Electron app)
const compassBackgroundSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="rgba(0, 0, 0, 0.3)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1"/>
    
    <!-- Degree markings -->
    <g stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.5">
      ${Array.from({ length: 36 }, (_, i) => {
        const angle = i * 10 - 90;
        const isCardinal = i % 9 === 0;
        const length = isCardinal ? 8 : 4;
        const x1 = 50 + 40 * Math.cos(angle * Math.PI / 180);
        const y1 = 50 + 40 * Math.sin(angle * Math.PI / 180);
        const x2 = 50 + (40 - length) * Math.cos(angle * Math.PI / 180);
        const y2 = 50 + (40 - length) * Math.sin(angle * Math.PI / 180);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${isCardinal ? 1 : 0.5}"/>`;
      }).join('')}
    </g>
    
    <!-- Cardinal direction labels -->
    <text x="50" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">N</text>
    <text x="82" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">E</text>
    <text x="50" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">S</text>
    <text x="18" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">W</text>
    
    <!-- Center dot -->
    <circle cx="50" cy="50" r="2" fill="rgba(255, 255, 255, 0.6)"/>
  </svg>
`;

/**
 * Initialize Photo Sphere Viewer
 */
function initializeViewer() {
    const { Viewer } = window.PhotoSphereViewer;
    const { MarkersPlugin } = window.PhotoSphereViewer;
    const { CompassPlugin } = window.PhotoSphereViewer;
    
    viewer = new Viewer({
        container: document.getElementById('viewer'),
        panorama: '', // Will be set when loading scene
        plugins: [
            [MarkersPlugin, {
                markers: []
            }],
            [CompassPlugin, {
                size: '120px',
                position: 'top left',
                backgroundSvg: compassBackgroundSvg,
                coneColor: 'rgba(255, 255, 255, 0.5)',
                navigation: true,
                hotspots: [],
                hotspotColor: '#f97316',
            }]
        ],
        navbar: [
            'zoom',
            'move',
            'fullscreen',
        ],
        defaultZoomLvl: 50,
        mousewheel: true,
        mousemove: true,
        fisheye: false,
    });
    
    markersPlugin = viewer.getPlugin(MarkersPlugin);
    compassPlugin = viewer.getPlugin(CompassPlugin);
    
    // Listen for marker clicks
    markersPlugin.addEventListener('select-marker', ({ marker }) => {
        handleHotspotClick(marker.data);
    });
}

/**
 * Load a scene by ID
 */
function loadScene(sceneId) {
    const scene = projectData.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error('Scene not found:', sceneId);
        return;
    }
    
    currentSceneId = sceneId;
    
    // Update active scene in list
    updateSceneList();
    
    // Load panorama
    viewer.setPanorama(scene.imagePath, {
        zoom: projectData.settings?.initialFov || 50,
        sphereCorrection: scene.sphereCorrection || { pan: 0, tilt: 0, roll: 0 }
    }).then(() => {
        // Load hotspots for this scene
        loadHotspots(scene);
        
        // Update compass hotspots
        if (compassPlugin && scene.hotspots) {
            const compassHotspots = scene.hotspots.map(hotspot => ({
                yaw: hotspot.position?.yaw || hotspot.yaw || 0,
                pitch: hotspot.position?.pitch || hotspot.pitch || 0,
            }));
            compassPlugin.setHotspots(compassHotspots);
        }
        
        // Update right sidebar
        updateHotspots(scene);
        updateComments(scene);
    });
}

/**
 * Load hotspots for the current scene
 */
function loadHotspots(scene) {
    markersPlugin.clearMarkers();
    
    if (!scene.hotspots || scene.hotspots.length === 0) {
        return;
    }
    
    const markers = scene.hotspots
        .filter(hotspot => hotspot.isVisible !== false)
        .map(hotspot => createMarker(hotspot));
    
    markersPlugin.setMarkers(markers);
}

/**
 * Create a marker from hotspot data
 */
function createMarker(hotspot) {
    const marker = {
        id: hotspot.id,
        position: { 
            yaw: hotspot.position?.yaw || hotspot.yaw || 0, 
            pitch: hotspot.position?.pitch || hotspot.pitch || 0 
        },
        data: hotspot,
        tooltip: hotspot.tooltip || getDefaultTooltip(hotspot),
    };
    
    // Set marker style based on type - matching Electron app exactly
    if (hotspot.type === 'scene') {
        marker.html = `
            <div class="custom-marker scene-marker">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#6366f1" stroke="white" stroke-width="2"/>
                <path d="M9 12L13 8L13 16L9 12Z" fill="white" transform="translate(2, 0)"/>
              </svg>
            </div>
        `;
        marker.size = { width: 32, height: 32 };
        marker.anchor = 'center center';
        marker.className = 'psv-marker-scene';
    } else if (hotspot.type === 'info') {
        marker.html = `
            <div class="custom-marker info-marker">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="white" stroke-width="2"/>
                <text x="12" y="17" font-size="14" font-weight="bold" fill="white" text-anchor="middle">i</text>
              </svg>
            </div>
        `;
        marker.size = { width: 32, height: 32 };
        marker.anchor = 'center center';
        marker.className = 'psv-marker-info';
    } else if (hotspot.type === 'url') {
        marker.html = `
            <div class="custom-marker url-marker">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
                <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
        `;
        marker.size = { width: 32, height: 32 };
        marker.anchor = 'center center';
        marker.className = 'psv-marker-url';
    }
    
    return marker;
}

/**
 * Get default tooltip text based on hotspot type
 */
function getDefaultTooltip(hotspot) {
    if (hotspot.type === 'scene') {
        const targetScene = projectData.scenes.find(s => s.id === hotspot.targetSceneId);
        return targetScene ? `Go to ${targetScene.name}` : 'Go to scene';
    } else if (hotspot.type === 'info') {
        return hotspot.title || 'View information';
    } else if (hotspot.type === 'url') {
        return 'Open link';
    }
    return '';
}

/**
 * Handle hotspot click
 */
function handleHotspotClick(hotspot) {
    if (hotspot.type === 'scene') {
        // Navigate to target scene
        loadScene(hotspot.targetSceneId);
    } else if (hotspot.type === 'info') {
        // Show info modal
        showInfoModal(hotspot.title || 'Information', hotspot.content || '');
    } else if (hotspot.type === 'url') {
        // Open URL in new tab
        window.open(hotspot.url, hotspot.openInNewTab !== false ? '_blank' : '_self');
    }
}

/**
 * Update project info in UI
 */
function updateProjectInfo() {
    const projectNameElement = document.getElementById('project-name');
    if (projectNameElement) {
        projectNameElement.textContent = projectData.name || 'Panorama Tour';
    }
    
    // Update page title
    document.title = projectData.name || 'Panorama Viewer';
}

/**
 * Update scene list in left sidebar
 */
function updateSceneList() {
    const sceneList = document.getElementById('scene-list');
    const sceneCount = document.getElementById('scene-count');
    sceneList.innerHTML = '';
    
    // Update scene count
    const visibleScenes = projectData.scenes.filter(scene => scene.isVisible !== false);
    sceneCount.textContent = `${visibleScenes.length} scene${visibleScenes.length !== 1 ? 's' : ''}`;
    
    // Create scene items
    visibleScenes.forEach(scene => {
        const sceneItem = document.createElement('div');
        sceneItem.className = 'scene-item';
        if (scene.id === currentSceneId) {
            sceneItem.classList.add('active');
        }
        
        // Create thumbnail image
        const thumbnail = document.createElement('img');
        thumbnail.src = scene.thumbnail || scene.imagePath;
        thumbnail.alt = scene.name;
        thumbnail.className = 'scene-thumbnail';
        
        // Create scene name overlay
        const sceneName = document.createElement('div');
        sceneName.className = 'scene-name';
        sceneName.textContent = scene.name;
        
        // Add featured badge if applicable
        if (scene.isFeatured) {
            const badge = document.createElement('span');
            badge.className = 'featured-badge';
            badge.textContent = 'Featured';
            sceneName.appendChild(badge);
        }
        
        // Assemble scene item
        sceneItem.appendChild(thumbnail);
        sceneItem.appendChild(sceneName);
        
        // Add click handler
        sceneItem.addEventListener('click', () => {
            loadScene(scene.id);
        });
        
        sceneList.appendChild(sceneItem);
    });
}

/**
 * Show info modal
 */
function showInfoModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').textContent = content;
    document.getElementById('info-modal').classList.add('open');
}

/**
 * Close info modal
 */
function closeInfoModal() {
    document.getElementById('info-modal').classList.remove('open');
}

/**
 * Toggle fullscreen
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

/**
 * Show error message
 */
function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.querySelector('p').textContent = message;
    loadingScreen.querySelector('.spinner').style.display = 'none';
}

/**
 * Open gallery modal
 */
function openGallery() {
    const galleryModal = document.getElementById('gallery-modal');
    const galleryGrid = document.getElementById('gallery-grid');
    
    // Clear existing cards
    galleryGrid.innerHTML = '';
    
    // Render scene cards
    const visibleScenes = projectData.scenes.filter(scene => scene.isVisible !== false);
    
    visibleScenes.forEach(scene => {
        const card = document.createElement('div');
        card.className = 'scene-card';
        if (scene.id === currentSceneId) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <img 
                src="${scene.thumbnail || scene.imagePath}" 
                alt="${scene.name}" 
                class="scene-card-image"
            />
            <div class="scene-card-content">
                <h3 class="scene-card-title">
                    ${scene.name}
                    ${scene.isFeatured ? '<span class="featured-badge">Featured</span>' : ''}
                </h3>
            </div>
        `;
        
        // Click to load scene and close modal
        card.addEventListener('click', () => {
            loadScene(scene.id);
            closeGallery();
        });
        
        galleryGrid.appendChild(card);
    });
    
    // Show modal
    galleryModal.classList.add('open');
}

/**
 * Close gallery modal
 */
function closeGallery() {
    document.getElementById('gallery-modal').classList.remove('open');
    // Clear search when closing
    document.getElementById('gallery-search-input').value = '';
}

/**
 * Filter gallery scenes based on search query
 */
function filterGalleryScenes(query) {
    const galleryGrid = document.getElementById('gallery-grid');
    const sceneCards = galleryGrid.querySelectorAll('.scene-card');
    const lowerQuery = query.toLowerCase();
    
    sceneCards.forEach(card => {
        const title = card.querySelector('.scene-card-title').textContent.toLowerCase();
        if (title.includes(lowerQuery)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Toggle right sidebar
 */
function toggleRightSidebar() {
    const rightSidebar = document.getElementById('right-sidebar');
    rightSidebar.classList.toggle('open');
}

/**
 * Close right sidebar
 */
function closeRightSidebar() {
    document.getElementById('right-sidebar').classList.remove('open');
}

/**
 * Get hotspot icon SVG based on type
 */
function getHotspotIconSVG(type) {
    if (type === 'scene') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
        </svg>`;
    } else if (type === 'info') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`;
    } else if (type === 'url') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>`;
    }
}

/**
 * Update hotspots list in right sidebar
 */
function updateHotspots(scene) {
    const hotspotsList = document.getElementById('hotspots-list');
    const hotspotsCount = document.getElementById('hotspots-count');
    
    hotspotsList.innerHTML = '';
    
    if (!scene.hotspots || scene.hotspots.length === 0) {
        hotspotsList.innerHTML = '<div class="empty-state">No hotspots in this scene</div>';
        hotspotsCount.textContent = '0';
        return;
    }
    
    hotspotsCount.textContent = scene.hotspots.length.toString();
    
    scene.hotspots.forEach(hotspot => {
        const item = document.createElement('div');
        item.className = 'hotspot-item';
        
        const label = hotspot.tooltip || hotspot.title || `${hotspot.type} hotspot`;
        
        item.innerHTML = `
            <div class="hotspot-icon ${hotspot.type}">
                ${getHotspotIconSVG(hotspot.type)}
            </div>
            <span class="hotspot-label">${label}</span>
            <button class="hotspot-show-btn" title="Navigate to hotspot">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
        `;
        
        // Add click handler for show button
        const showBtn = item.querySelector('.hotspot-show-btn');
        showBtn.addEventListener('click', () => {
            navigateToHotspot(hotspot);
        });
        
        hotspotsList.appendChild(item);
    });
}

/**
 * Navigate camera to hotspot position
 */
function navigateToHotspot(hotspot) {
    if (viewer && hotspot.position) {
        viewer.animate({
            yaw: hotspot.position.yaw || 0,
            pitch: hotspot.position.pitch || 0,
            zoom: 50,
            speed: '2rpm'
        });
    }
}

/**
 * Update comments list in right sidebar
 */
function updateComments(scene) {
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');
    
    commentsList.innerHTML = '';
    
    if (!scene.comments || scene.comments.length === 0) {
        commentsList.innerHTML = '<div class="empty-state">No comments for this scene</div>';
        commentsCount.textContent = '0';
        return;
    }
    
    commentsCount.textContent = scene.comments.length.toString();
    
    scene.comments.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        
        item.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-timestamp">${comment.timestamp}</div>
        `;
        
        commentsList.appendChild(item);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar toggle buttons
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const expandSidebarBtn = document.getElementById('expand-sidebar-btn');
    const leftSidebar = document.getElementById('left-sidebar');
    
    console.log('Sidebar elements:', {
        sidebarToggleBtn,
        expandSidebarBtn,
        leftSidebar
    });
    
    if (!sidebarToggleBtn || !expandSidebarBtn || !leftSidebar) {
        console.error('Missing sidebar elements!');
        return;
    }
    
    sidebarToggleBtn.addEventListener('click', () => {
        console.log('Collapse button clicked');
        leftSidebar.classList.add('collapsed');
        expandSidebarBtn.classList.add('visible');
        console.log('Expand button classes:', expandSidebarBtn.className);
    });
    
    expandSidebarBtn.addEventListener('click', () => {
        console.log('Expand button clicked');
        leftSidebar.classList.remove('collapsed');
        expandSidebarBtn.classList.remove('visible');
    });
    
    // Close modal button
    document.getElementById('close-modal-btn').addEventListener('click', closeInfoModal);
    
    // Close modal on backdrop click
    document.getElementById('info-modal').addEventListener('click', (e) => {
        if (e.target.id === 'info-modal') {
            closeInfoModal();
        }
    });
    
    // Gallery button
    document.getElementById('gallery-btn').addEventListener('click', openGallery);
    
    // Close gallery button
    document.getElementById('close-gallery-btn').addEventListener('click', closeGallery);
    
    // Close gallery on backdrop click
    document.getElementById('gallery-modal').addEventListener('click', (e) => {
        if (e.target.id === 'gallery-modal') {
            closeGallery();
        }
    });
    
    // Gallery search input
    const gallerySearchInput = document.getElementById('gallery-search-input');
    gallerySearchInput.addEventListener('input', (e) => {
        filterGalleryScenes(e.target.value);
    });
    
    // Right sidebar toggle
    document.getElementById('right-sidebar-toggle').addEventListener('click', toggleRightSidebar);
    
    // Close right sidebar
    document.getElementById('close-right-sidebar').addEventListener('click', closeRightSidebar);
    
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        filterScenes(e.target.value);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeInfoModal();
            closeGallery();
        }
    });
}

/**
 * Filter scenes based on search query
 */
function filterScenes(query) {
    const sceneList = document.getElementById('scene-list');
    const sceneItems = sceneList.querySelectorAll('.scene-item');
    const lowerQuery = query.toLowerCase();
    
    sceneItems.forEach(item => {
        const sceneName = item.querySelector('.scene-name').textContent.toLowerCase();
        if (sceneName.includes(lowerQuery)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

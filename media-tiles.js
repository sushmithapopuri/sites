// media-tiles.js
// Query all files from the media folder using the Drive API and display as tiles

// --- CONFIG ---
var mediaFolderLink = 'YOUR_MEDIA_FOLDER_LINK_HERE'; // Replace with your Google Drive media folder link
var apiKey = 'YOUR_GOOGLE_API_KEY_HERE'; // Replace with your Google API key

// --- ICONS by mimeType ---
function getMediaIcon(mimeType, name) {
    if (mimeType && mimeType.startsWith('video/')) return '🎬';
    if (mimeType && mimeType.startsWith('audio/')) return '🎵';
    if (mimeType && mimeType.startsWith('image/')) return '🖼️';
    if (name && name.match(/\.(mp4|mkv|avi)$/i)) return '🎬';
    if (name && name.match(/\.(mp3|wav|aac)$/i)) return '🎵';
    if (name && name.match(/\.(jpg|jpeg|png|gif)$/i)) return '🖼️';
    return '📄';
}

// --- Extract folder ID from link ---
function extractFolderId(driveLink) {
    var match = driveLink.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}


// --- Query files from local media/videos folder (works in Node.js/Electron or with a backend) ---
function getFilesFromLocalMedia(callback) {
    // This will only work in a Node.js/Electron or server context, not in browser-only JS
    // For browser-only, you need a backend API to list files
    $.getJSON('media/videos/index.json', function(fileList) {
        // fileList should be an array of { name, path, size, mimeType }
        callback(fileList);
    }).fail(function() {
        callback([]);
    });
}

function listFilesFromFolder(folderUrl) {
  $.ajax({
    url: "media",
    success: function (data) {
      // Parse directory listing HTML
      $(data).find("a").each(function () {
        var file = $(this).attr("href");
        
        // Ignore parent folder link
        if (file && file !== "../") {
          $("#fileList").append("<li><a href='" + folderUrl + file + "' target='_blank'>" + file + "</a></li>");
        }
      });
    },
    error: function () {
      alert("Failed to load folder. Directory listing might be disabled.");
    }
  });
}

// --- Render tiles ---
function renderMediaTiles(files) {
    var $tiles = $('#media-tiles');
    $tiles.empty();
    if (!files || files.length === 0) {
        $tiles.append('<div>No media files found.</div>');
        return;
    }
    $.each(files, function(i, f) {
        var icon = getMediaIcon(f.mimeType, f.name);
        var size = f.size ? (f.size / (1024*1024)).toFixed(2) + ' MB' : '';
        var tile = `<div class="media-tile">
            <span class="media-icon">${icon}</span>
            <span class="media-name">${f.name}</span>
            <span class="media-size">${size}</span>
        </div>`;
        $tiles.append(tile);
    });
}

// --- Search filter ---
function filterTiles(query) {
    $('.media-tile').each(function() {
        var name = $(this).find('.media-name').text().toLowerCase();
        $(this).toggle(name.indexOf(query.toLowerCase()) !== -1);
    });
}

// --- Main ---
$(document).ready(function() {
    listFilesFromFolder(function(files) {
        renderMediaTiles(files);
    });
    $('#media-search').on('input', function() {
        filterTiles($(this).val());
    });
});

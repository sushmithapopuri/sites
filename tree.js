

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c];
  });
}

function generateTree(node, parentPath = '', level = 0) {
  let html = '';
  if (node.type === 'folder') {
    const folderId = 'tree_' + btoa(parentPath + node.title).replace(/=/g, '');
    html += `
      <div class="tree-folder" style="margin-left:${level * 24}px;">
        <div class="tree-folder-header" style="display:flex;align-items:center;cursor:pointer;gap:8px;" onclick="toggleTree('${folderId}')">
          <i class="material-icons" id="icon_${folderId}">chevron_right</i>
          <i class="material-icons" style="color:#1976d2;">folder</i>
          <span class="video-title" style="margin:0;">${escapeHtml(node.title)}</span>
        </div>
        <div class="tree-children" id="${folderId}" style="display:none;">
          ${(node.children || []).map(child => generateTree(child, parentPath + node.name + '/', level + 1)).join('')}
        </div>
      </div>
    `;
  } else if (node.type === 'file' && node.name.endsWith('.mp4')) {
    const videoPath = parentPath + node.name;
    html += `
      <div class="tree-file" style="margin-left:${level * 24 + 32}px;display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;" onclick="playInSidePane('${escapeHtml(node.title)}', '${videoPath}')">
        <i class="material-icons" style="color:#1976d2;">movie</i>
        <span class="video-title">${escapeHtml(node.title)}</span>
      </div>
    `;
  } else if (node.type === 'file') {
    html += `
      <div class="tree-file" style="margin-left:${level * 24 + 32}px;display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <i class="material-icons" style="color:#1976d2;">insert_drive_file</i>
        <span class="video-title">${escapeHtml(node.title)}</span>
      </div>
    `;
  }
  return html;
}

document.addEventListener('DOMContentLoaded', function() {
  fetch('assets.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load assets.json');
      return response.json();
    })
    .then(data => {
      const treeRoot = document.getElementById('treeRoot');
      let html = '';
      for (let i = 0; i < data.length; i++) {
        html += generateTree(data[i], 'assets/', 0);
      }
      treeRoot.innerHTML = html;
    })
    .catch(err => {
      const treeRoot = document.getElementById('treeRoot');
      if (treeRoot) treeRoot.innerHTML = '<div style="color:red">Failed to load assets.json</div>';
      console.error(err);
    });

  window.toggleTree = function(id) {
    var el = document.getElementById(id);
    var icon = document.getElementById('icon_' + id);
    if (el.style.display === 'none') {
      el.style.display = 'block';
      if (icon) icon.textContent = 'expand_more';
    } else {
      el.style.display = 'none';
      if (icon) icon.textContent = 'chevron_right';
    }
  }
  window.playInSidePane = function(title, videoPath) {
    var sidePane = document.getElementById('sidePane');
    var video = document.getElementById('sidePaneVideo');
    var titleElem = document.getElementById('sidePaneTitle');
    if (sidePane && video && titleElem) {
      sidePane.style.display = 'block';
      video.src = videoPath;
      video.load();
      video.play();
      titleElem.textContent = title;
    }
  }
});

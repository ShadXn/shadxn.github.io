// ==UserScript==
// @name         Send to Tubern
// @namespace    https://tubern.net
// @version      1.0
// @description  Adds a button to send YouTube videos to Tubern for conversion
// @match        https://www.youtube.com/watch?*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    function addTubernButton() {
        // Check if button already exists
        if (document.getElementById('tubern-btn')) return;

        // Locate YouTube's action panel
        let actionPanel = document.querySelector('#top-level-buttons-computed') || document.querySelector('#menu-container');

        if (!actionPanel) return; // Exit if no action panel found

        // Create the container div
        let tubernContainer = document.createElement('div');
        tubernContainer.id = 'tubern-container';
        tubernContainer.style.marginTop = '10px';
        tubernContainer.style.display = 'flex';
        tubernContainer.style.alignItems = 'center';
        tubernContainer.style.gap = '10px';

        // Create the Tubern button
        let tubernButton = document.createElement('button');
        tubernButton.id = 'tubern-btn';
        tubernButton.innerText = 'Send to Tubern';
        tubernButton.style.padding = '8px 12px';
        tubernButton.style.backgroundColor = '#ff0000';
        tubernButton.style.color = 'white';
        tubernButton.style.border = 'none';
        tubernButton.style.cursor = 'pointer';
        tubernButton.style.borderRadius = '5px';
        tubernButton.style.fontSize = '14px';

        // Create the radio buttons
        let musicRadio = document.createElement('input');
        musicRadio.type = 'radio';
        musicRadio.name = 'tubern-type';
        musicRadio.value = 'music';
        musicRadio.checked = true;

        let musicLabel = document.createElement('label');
        musicLabel.innerText = 'Music';
        musicLabel.style.color = 'white';

        let videoRadio = document.createElement('input');
        videoRadio.type = 'radio';
        videoRadio.name = 'tubern-type';
        videoRadio.value = 'video';

        let videoLabel = document.createElement('label');
        videoLabel.innerText = 'Video';
        videoLabel.style.color = 'white';

        // Append elements
        tubernContainer.appendChild(musicRadio);
        tubernContainer.appendChild(musicLabel);
        tubernContainer.appendChild(videoRadio);
        tubernContainer.appendChild(videoLabel);
        tubernContainer.appendChild(tubernButton);

        // Add to YouTube UI
        actionPanel.parentElement.insertBefore(tubernContainer, actionPanel.nextSibling);

        // Button Click Handler
        tubernButton.addEventListener('click', function() {
            let videoUrl = window.location.href;
            let selectedType = document.querySelector('input[name="tubern-type"]:checked').value;

            sendToTubern(videoUrl, selectedType);
        });
    }

    function sendToTubern(url, type) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://beta.tubern.net/download.php?type=${selectedType}&url=${encodeURIComponent(videoUrl)}',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ url: url, type: type }),
            onload: function(response) {
                if (response.status === 200) {
                    alert('Video sent to Tubern successfully!');
                } else {
                    alert('Error sending video to Tubern.');
                }
            }
        });
    }

    // Wait for page load
    setTimeout(addTubernButton, 2000);
})();

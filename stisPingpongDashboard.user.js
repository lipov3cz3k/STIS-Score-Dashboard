// ==UserScript==
// @name         Stis Pingpong Score Dashboard
// @namespace    https://stis.ping-pong.cz/
// @version      0.6
// @description  Display score for ping-pong matches in STIS system
// @author       Tomáš Lipovský
// @downloadURL  https://raw.githubusercontent.com/lipov3cz3k/STIS-Score-Dashboard/main/stisPingpongDashboard.user.js
// @updateURL    https://raw.githubusercontent.com/lipov3cz3k/STIS-Score-Dashboard/main/stisPingpongDashboard.user.js
// @match        https://stis.ping-pong.cz/*
// @icon         https://stis.ping-pong.cz/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==


(function () {
    'use strict';

    // Define styles
    GM_addStyle(`
        .overlay {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0);
            z-index: 2;
            cursor: pointer;
            color: white;
            font-size: large;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        .scoreDisplay {
            text-align: center;
            font-size: 30vw;
        }
        .homeTeamDisplay {
            font-size: 4vw;
            align-self: baseline;
            padding-left: 1em;
        }
        .awayTeamDisplay {
            font-size: 4vw;
            align-self: end;
            padding-right: 1em;
        }
    `);

    var scoreUpdateInterval = 10000; // 10 seconds
    var scoreUpdateIntervalId = null;
    // Create overlay
    var overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.addEventListener('click', function () {
        overlay.style.display = 'none';
        clearInterval(scoreUpdateIntervalId);
    });

    // Create home team display
    var homeTeamDisplay = document.createElement('h5');
    homeTeamDisplay.classList.add('homeTeamDisplay');
    overlay.appendChild(homeTeamDisplay);

    // Create score display
    var scoreDisplay = document.createElement('h1');
    scoreDisplay.classList.add('scoreDisplay');
    overlay.appendChild(scoreDisplay);


    // Create away team display
    var awayTeamDisplay = document.createElement('h5');
    awayTeamDisplay.classList.add('awayTeamDisplay');
    overlay.appendChild(awayTeamDisplay);

    // Function to create button
    var createButton = function (id) {
        var button = document.createElement('button');
        button.textContent = 'Kuk na skóre';
        button.setAttribute('eventId', id);
        button.onclick = function () {
            var eventId = this.getAttribute('eventId');
            overlay.style.display = 'flex';
            scoreDisplay.textContent = '...';
            homeTeamDisplay.textContent = '';
            awayTeamDisplay.textContent = '';
            updateScore(eventId);
            scoreUpdateIntervalId = setInterval(updateScore, scoreUpdateInterval, eventId);
        };
        return button;
    };

    // Function to handle mutations
    var addScoreboardButton = function () {
        // Get all elements with class 'zapis-place'
        var zapisPlaceElements = document.querySelectorAll('.zapis-place');
        zapisPlaceElements.forEach(function (element) {
            if (!element.querySelector('button')) {
                element.insertBefore(createButton(element.id), element.firstChild);
            }
        });
    };

    // Function to update score
    var updateScore = function (eventId) {
        var query = "q=" + window.location.pathname.substring(1) + "/format.json";
        var url = 'https://stis.ping-pong.cz/api/?' + query;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=loadzapis&id=' + eventId
        })
            .then(response => response.json())
            .then(result => {
                if (result.result === 'ok') {
                    var score = result.data.vysledek.padStart(4, '0');;
                    var homeScore = parseInt(score.slice(0, -2));
                    var awayScore = parseInt(score.slice(-2));
                    scoreDisplay.textContent = homeScore + " : " + awayScore;
                    homeTeamDisplay.textContent = result.data.dnazev
                    awayTeamDisplay.textContent = result.data.hnazev;
                }
                console.log(result);
            })
            .catch(error => console.log('Error:', error));
    }

    document.body.appendChild(overlay);

    // Get the element to observe
    var targetNode = document.querySelector('#div_zapisy');
    if (targetNode) {
        var observer = new MutationObserver(addScoreboardButton);
        observer.observe(targetNode, { childList: true, subtree: true });
    } else {
        console.log('Target node not found');
    }

    // Add button to existing elements
    addScoreboardButton();
})();
var upHist = false;
var token = getCSRFToken();

function getCSRFToken() {
    var csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');

    if (csrfTokenInput) {
        var csrfToken = csrfTokenInput.value;
        return csrfToken;
    } else {
        console.error("CSRF Token input not found!");
        return null;
    }
}

function showDiv(divId) {
    var divs = document.querySelectorAll('.block');
    divs.forEach(function (div) {
        div.style.display = 'none';
    });

    var selectedDiv = document.getElementById(divId);
    if (selectedDiv) {
        selectedDiv.style.display = 'block';

        if (!upHist) {
			var stateObj = { divId: divId };
			var url = window.location.href.split('#')[0] + '#' + divId;
			history.pushState(stateObj, null, url);
            checkURL();
		}
		else
			upHist = false;
    }
}

function showNewPseudo(){
    var BtnDiv = document.getElementById('change');
    BtnDiv.style.display = 'none';
    var BtnHideDiv = document.getElementById('hide');
    BtnHideDiv.style.display = 'flex';
    var div = document.querySelector('.newPseudo');
    div.style.display = 'block';
}

function hideNewPseudo(){
    var BtnDiv = document.getElementById('change');
    BtnDiv.style.display = 'flex';
    var BtnHideDiv = document.getElementById('hide');
    BtnHideDiv.style.display = 'none';
    var div = document.querySelector('.newPseudo');
    div.style.display = 'none';
}

function sendForm(id, event) {
    var form = document.getElementById(id);
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action, true);
    xhr.setRequestHeader('X-CSRFToken', token);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var errorForm = form.querySelector('.error-form');
            if (response.success) {
                if (formData.get('type') == 'sendChat') {
                    websocket.send(
                        JSON.stringify({
                            action: 'sendChat',
                            tournament: formData.get('tournament'),
                            pseudo: formData.get('id_to')
                        })
                    );
                    getMessages();
                    return;
                }
                else if (formData.get('type') == 'createTour') {
                    openTournamentChat(formData.get('tourName'));
                    getMessages();
                }
                if (errorForm)
                    errorForm.innerHTML = response.errors;
                if (response.goto) {
                    setTimeout(function () {
                        window.location.href = response.goto;
                        location.reload(true);
                        if (errorForm)
                            errorForm.innerHTML = "";
                    }, 2000);
                }
                else if (window.location.hash === "#profil")
                    loadProfileData();
            } else {
                if (errorForm)
                    errorForm.innerHTML = response.errors;
            }
            token = response.csrf_token;
        }
    };
    xhr.send(formData);
    event.preventDefault();
}

function loadProfileData() {
    $.ajax({
        type: 'GET',
        url: '/getProfil/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            $('#username').text('Username: ' + data.username);
            $('#nickname').text('Nickname: ' + data.pseudo);
            $('#email').text('Email: ' + data.email);
            $('#img').attr('src', data.img);
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des données du profil.');
        }
    });
}

async function getPseudo() {
    try {
      const response = await $.ajax({
        type: 'GET',
        url: '/getProfil/',
        headers: { 'X-CSRFToken': token },
      });
      token = response.csrf_token;
      return response.users[0];
    } catch (error) {
      console.log('Erreur lors de la récupération des données du profil.');
    }
  }

function clearInput(button) {
    var form = button.closest('form');
    if (form) {
        var inputField = form.querySelector('input[name="content"]');
        if (inputField) {
            inputField.value = '';
        }
    }
}

function TournamentUpdate(id, statut) {
    var formData = new FormData();
    formData.append('type', 'tourUpdate');
    formData.append('id', id);
    formData.append('statut', statut);
    $.ajax({
        type: 'POST',
        url: '/tourUpdate/',
        headers: { 'X-CSRFToken': token },
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            $('#error-tour').text(data.errors);
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function TournamentRegistration(id, join) {
    var formData = new FormData();
    formData.append('type', 'tourRegist');
    formData.append('id', id);
    formData.append('join', (join ? 'true' : 'false'));
    $.ajax({
        type: 'POST',
        url: '/tourRegist/',
        headers: { 'X-CSRFToken': token },
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des amis.');
        }
    });
}

function checkURL() {
    if (window.location.hash === "#profil")
        loadProfileData();
    if (window.location.hash === "#stats")
        loadStats();
}

function loadStats() {
    $.ajax({
        type: 'PUT',
        url: '/loadStats/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            getStats();
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des joueurs.');
        }
    });
}

function getStats() {
    $.ajax({
        type: 'GET',
        url: '/getStats/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var usersList = data.users;
                var usersContainer = $('#stats-users-container');
                usersContainer.empty();
                usersList.forEach(function (user) {
                    printStats(user);
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des joueurs.');
        }
    });
}

function printStats(user) {
    var statCont = document.getElementById('stats-users-container');
    var list = document.createElement('tr');
    list.className = 'users-list';
    list.onclick = function () {
    var statsTournament = document.createElement('ul');       
        var attr = document.createElement('li');
        attr.className = 'nb_game';
        attr.textContent = 'Tournament participations: ' + user.TournamentPlayed;
        statsTournament.appendChild(attr);
        var attr2 = document.createElement('li');
        attr2.className = 'game_win';
        attr2.textContent = 'Tournaments won: ' + user.TournamentWin;
        statsTournament.appendChild(attr2);
    var statsOnline = document.createElement('ul');
        var attr = document.createElement('li');
        attr.className = 'nb_game';
        attr.textContent = 'Online games played: ' + user.gamesLocalPlayed;
        statsOnline.appendChild(attr);
        var attr2 = document.createElement('li');
        attr2.className = 'game_win';
        attr2.textContent = 'Games won: ' + user.gamesLocalWin;
        statsOnline.appendChild(attr2);
        document.getElementById('profil-card').style.display = 'flex';
        document.getElementById('profile').style.display = 'inline-flex';
        document.getElementById('profil-card').classList.toggle('profil-open');   
        $('#user-name').text(user.username);
        $('#user-pseudo').text(user.pseudo);
        $('#user-email').text(user.email);
        $('#user-img').attr('src', user.img);
        $('#user-stats-tournament').empty().append(statsTournament);
        $('#user-stats-online').empty().append(statsOnline);
        document.getElementById('profil-card').addEventListener( "click", () => {
            document.getElementById('profil-card').classList.toggle('profil-open');   
            document.getElementById('profil-card').style.display = 'none';
            document.getElementById('profile').style.display = 'none';
        });
        
    }

    var attr = document.createElement('td');
    attr.className = 'pseudo';
    attr.textContent = user.pseudo;
    list.appendChild(attr);
    var attr2 = document.createElement('td');
    attr2.className = 'img';
    var img = document.createElement('img');
    img.src = user.img;
    attr2.appendChild(img);
    list.appendChild(attr2);
    var attr3 = document.createElement('td');
    attr3.className = 'nb_game';
    attr3.textContent = user.nb_game;
    list.appendChild(attr3);
    var attr4 = document.createElement('td');
    attr4.className = 'mmr';
    attr4.textContent = user.mmr;
    list.appendChild(attr4);

    statCont.appendChild(list);
}

window.addEventListener('hashchange', function () {
	var divId = location.hash.slice(1) || 'index';
	upHist = true;
	console.log("Call hashchange : " + divId);
    showDiv(divId);
});

document.addEventListener('DOMContentLoaded', function () {
    var defaultDivId = location.hash.slice(1) || 'index';
	console.log("First call : " + defaultDivId);
    showDiv(defaultDivId);
});

document.getElementById('profil-img').addEventListener('change', function (event) {
    sendForm('profilImg', event)
});

function displayDiv(hide, show) {
    var hideDiv = document.getElementById(hide);
    if (hideDiv)
        hideDiv.style.display = 'none';
    
    var showDiv = document.getElementById(show);
    if (showDiv)
        showDiv.style.display = 'block';
    if (((hide === 'friend') && (show === 'blocked-friends')) || ((show === 'friend') && (hide === 'blocked-friends')))
        $('#error-block').empty();
}

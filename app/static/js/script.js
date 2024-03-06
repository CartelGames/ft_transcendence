var upHist = false;

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

function sendForm(id, event) {
    var form = document.getElementById(id);
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var errorForm = form.querySelector('.error-form');
            if (response.success) {
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
                if (window.location.hash === "#profil")
                    loadProfileData();
            } else {
                if (errorForm)
                    errorForm.innerHTML = response.errors;
            }
        }
    };
    xhr.send(formData);
    event.preventDefault();
}

function loadProfileData() {
    $.ajax({
        type: 'GET',
        data: { data: 'profil' },
        success: function (data) {
            $('#username').text('Username: ' + data.username);
            $('#email').text('Email: ' + data.email);
            $('#img').attr('src', data.img);
            console.log('User: ' + data.username + ' Email: ' + data.email + ' IMG: ' + data.img);
        },
        error: function (error) {
            console.log('Erreur lors de la récupération des données du profil.');
        }
    });
}

function checkURL() {
    if (window.location.hash === "#profil")
        loadProfileData();
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
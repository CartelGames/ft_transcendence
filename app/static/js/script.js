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
            if (response.success) {
            // si loginForm go index ?
            } else {
                document.getElementById('error-form').innerHTML = response.errors;
                console.log(response.errors);
            }
        }
    };
    xhr.send(formData);
    event.preventDefault();
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
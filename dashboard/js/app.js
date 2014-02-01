var hash = location.hash.split('/');

function loadKibana() {
    $('#kibana-iframe').attr('src', 'kibana-latest/index.html');
}

function fitTabContainer () {
    $('#tab-container').height($(window).height() - $('#topbar').height() - 30);
}

window.onresize = fitTabContainer;
fitTabContainer();

var API_HOST = 'http://' + window.location.hostname + ':5000/';
var API_BASE = API_HOST;
    API_BASE += hash[1] + '/' + hash[2];
if (hash.length > 1) var REPO = hash[1] + '/' + hash[2];
else getDefaultRepo();

$('#user-repo').text(REPO);
$('#repo-select-trigger').on('click', function () {

    var $container = $('.repo-select');
    var $repoList = $('ul', $container);

    $container.toggleClass('hidden');
    $repoList.toggleClass('show--fade-in');

    if (!$container.hasClass('hidden')) {
        getAvailableRepos(addRepos);
    } else {
        setTimeout(function () {
            $repoList.empty();
        }, 200);
    }
});

function getAvailableRepos (cb) {
    $.get(API_HOST + 'available_repos')
        .success(cb)
    .fail(function (data) {
        console.log(data.reponseText);
        console.log('An error has occured');
    });
}

function addRepos (data) {

    var $container = $('.repo-select');
    var $repoList = $('ul', $container);

    data.data.forEach(function (repo) {
        var repoLink = document.createElement('a');
        var repoLI = document.createElement('li');
        repoLink.href = location.origin + '/#/' + repo;
        repoLink.textContent = repo;
        repoLink.target = '_blank';
        repoLI.appendChild(repoLink);
        repoLI = $(repoLI);
        repoLI.on('click', function (e) {
            e.preventDefault();
            loadDashboard(repoLink.href);
        });
        $repoList.append(repoLI);
    });
}

function getDefaultRepo() {
    getAvailableRepos(function (data) {
        loadDashboard(location.origin + '/#/' + data.data[0]); // load first repo
    })
}

function loadDashboard (newlocation) {

    location.href = newlocation;
    location.reload();

}

var hash = location.hash.split('/');

function loadKibana() {
    $('#kibana-iframe').attr('src', 'kibana-latest/index.html');
}

function fitTabContainer () {
    var $container = $('#tab-container');
    $container.height($(window).height() - $container.offset().top - 20);
}

window.onresize = fitTabContainer;
fitTabContainer();

var API_HOST = 'http://' + window.location.hostname + ':5000/';
var API_BASE = API_HOST;
    API_BASE += hash[1] + '/' + hash[2];
if (hash.length > 1) {
    var REPO = hash[1] + '/' + hash[2];
} else {
    getDefaultRepo();
}

$('#user-repo').text(REPO);
$('#repo-select-trigger').on('click', function () {

    var $container = $('.repo-select');
    var $repoList = $('ul', $container);

    $container.toggleClass('hidden');

    if (!$container.hasClass('hidden')) {
        getAvailableRepos(addRepos);
    } else {
        $('.show--fade-in').removeClass('show--fade-in');
        setTimeout(function () {
            $repoList.empty();
        }, 200);
    }
});

function getAvailableRepos (cb) {
    $.get(API_HOST + 'available_repos')
        .success(cb)
    .fail(function (data) {
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

    $repoList.toggleClass('show--fade-in');
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

function populateOpenIssues() {
    $.get(API_BASE + "/issues_count").success(function (data) {
        var count = data.data.open;
        $('#open-issues-count').text(count);

        if (!count) {
            return;
        }

        var $p = $('#open-issues');
        $p.click(function () {
            var url = 'http://github.com/' + REPO + '/issues?state=open';
            window.location.href = url;
        });
        $p.addClass('clickable');
    });
}
populateOpenIssues();

function populateOpenPulls() {
    $.get(API_BASE + "/pulls_count").success(function (data) {
        var count = data.data.open;
        $('#open-pulls-count').text(count);

        if (!count) {
            return;
        }

        var $p = $('#open-pulls');
        $p.click(function () {
            var url = 'http://github.com/' + REPO + '/pulls?state=open';
            window.location.href = url;
        });
        $p.addClass('clickable');
    });
}
populateOpenPulls();

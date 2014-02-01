var API_BASE = 'http://' + window.location.hostname + ':5000/';

function loadKibana() {
    $('#kibana-iframe').attr('src', 'kibana-latest/index.html');
}

function fitTabContainer () {
    $('#tab-container').height($(window).height() - $('#topbar').height() - 30);
}
window.onresize = fitTabContainer;
fitTabContainer();

populateTimeline(PER_PAGE, 0);

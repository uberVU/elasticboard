var API_BASE = 'http://' + window.location.hostname + ':5000/';

function fitTabContainer () {
    $('#tab-container').height($(window).height() - $('#topbar').height() - 30);
}
window.onresize = fitTabContainer;
fitTabContainer();

populateTimeline(PER_PAGE, 0);


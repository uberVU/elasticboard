var data = null;
var timeoutOwner = null;
var timeoutRepository = null;
var owner = '';
var $inputOwner = $('.input--owner');
var $inputRepository = $('.input--repository');

function processUserRepos(owner) {
    var URL = 'https://api.github.com/users/' + owner + '/repos?per_page=1000';

    $.getJSON(URL)
      .success(function(d) {
        data = d;

        var repos = new Bloodhound({
            datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 4,
            local: data
        });

        repos.initialize();

        $inputRepository.typeahead('destroy');
        $inputRepository.typeahead(null, {
            name: 'repository',
            displayKey: 'name',
            source: repos.ttAdapter()
        });

        $inputRepository.focus();
    })
    .fail(function(d) {
        console.log(d);
        // TODO handle fail, probably bad username?
    });
}

$inputOwner.on('keyup change', function(e) {
    $inputRepository.on('focus', triggerAutocomplete);
});

function triggerAutocomplete(e) {
    $inputRepository.off('focus', triggerAutocomplete);
    processUserRepos(owner);
}

$inputRepository.on('keyup change', function(e) {
    $input = $(this);

    if (timeoutRepository) {
        window.clearTimeout(timeoutRepository);
    }
    timeoutRepository = window.setTimeout(function() {
        var name = $input.val().trim();

        if (!data || !name) {
            return;
        }

        var ok = data.some(function(r) {
            return r.name.toLowerCase() === name.toLowerCase();
        });

        if (ok) {
          showDashboardLink();
        }

    }, 200);
});

function showDashboardLink() {

    var link = $('<a/>').attr('href', '#').text('Go to the dashboard');
    var h2 = $('<h2/>').append(link);
    $('.form').html('').append(h2);

}

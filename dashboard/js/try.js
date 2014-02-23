var data = null;
function processUserRepos(owner) {
    var URL = 'https://api.github.com/users/' + owner + '/repos?per_page=1000';

    $.getJSON(URL).done(function(d) {
        data = d;

        var repos = new Bloodhound({
            datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 4,
            local: data
        });

        repos.initialize();

        $('.input--repository').typeahead('destroy');
        $('.input--repository').typeahead(null, {
            name: 'repository',
            displayKey: 'name',
            source: repos.ttAdapter()
        });

        $inputRepository.focus();
    });
}

var timeoutOwner = null;
var timeoutRepository = null;
var owner = '';
var $inputOwner = $('.input--owner');
var $inputRepository = $('.input--repository');

$inputOwner.on('keyup change', function(e) {
    $inputRepository.on('focus', triggerAutocomplete);
    if (timeoutOwner) {
        window.clearTimeout(timeoutOwner);
    }
    timeoutOwner = window.setTimeout(function() {
        var $input = $(e.target);

        owner = $input.val().trim();

        // TODO check if user exists and display some feedback
    }, 200);
});

function triggerAutocomplete(e) {
    $inputRepository.off('focus', triggerAutocomplete);
    processUserRepos(owner);
}

$inputRepository.on('keyup change', function(e) {
    if (timeoutRepository) {
        window.clearTimeout(timeoutRepository);
    }
    timeoutRepository = window.setTimeout(function() {
        var $input = $(e.target);
        var name = $input.val().trim();

        if (!data || !name) {
            return;
        }

        var ok = false;
        data.forEach(function(r) {
            if (r.name.toLowerCase() === name.toLowerCase()) {
                ok = true;
            }
        });

        if (ok) {
            // TODO: show GO button
            console.log("exists");
        }

    }, 200);
});

###*
# InfolisButton
#
# button_types:
#   - landing-page
#   - result-list
#   - result-list-item
#
# statuses:
#   - inactive
#   - ready
#   - working
#   - fail
#   - win
###
# button_type, appendContainer, highlightContainer, parent_button, href) ->
class InfolisButton

	constructor: (opts) ->
		@button_type       = opts.button_type
		appendContainer    = opts.appendContainer or 'body'
		highlightContainer = opts.highlightContainer or appendContainer
		@parent_button     = opts.parent_button
		@href              = opts.href or window.location.href.replace(/#.*/, '')
		@$appendContainer = $(appendContainer)
		@$highlightContainer = $(highlightContainer)
		@$el = $('<div>').appendTo(@$appendContainer)
		$css = $(SCOPED_CSS)[0]
		@$el.prepend $css
		scopedPolyFill $css
		@$el.append '<div class=\'infolis-button\'>'
		@renderCount = 0
		@status = 'inactive'
		@expanded = false
		@results = []
		@databases = []
		@publications = []
		@primary_data = []
		@datasets = []
		@error_message = undefined
		@flag_fetched = false
		@resultClass = null

	setStatus: (status, message, cb) ->
		@status = status
		if message
			@error_message = message
		@renderPartially()
		if cb
			cb message

	show: ->
		if @hidden
			@$highlightContainer.fadeIn()
		@hidden = false

	hide: ->
		if !@hidden
			@$highlightContainer.fadeOut()
		@hidden = true

	prioritize: ->
		`var i`
		bad_databases = GM_config.get('bad_databases').split(/\n/)
		i = 0
		while i < bad_databases.length
			bad = bad_databases[i]
			if @databases.indexOf(bad) >= 0
				@$highlightContainer.css 'opacity', '0.5'
				@$highlightContainer.css 'background', '#ccc'
			i++
		good_databases = GM_config.get('good_databases').split(/\n/)
		i = 0
		while i < good_databases.length
			good = good_databases[i]
			if @databases.indexOf(good) >= 0
				@$highlightContainer.css 'border', '3px dotted green '
				@$highlightContainer.css 'background', '#efe '
			i++

	list: (coll) ->
		# console.debug("Listing all " + coll);
		ret = []
		if coll == 'publications'
			ret = @publications.slice(0)
		else
			@publications.forEach (pub) ->
				return unless pub[coll]
				pub[coll].forEach (data) ->
					ret.push data
		@results or (@results = [])
		@results.forEach (result) ->
			result.button.list(coll).forEach (childData) ->
				ret.push childData
		ret

	number_found: ->
		nr = 0
		[
			'databases'
			'datasets'
		].forEach (coll) =>
			nr += @list(coll).length
		nr

	fetchDOI: (done) ->
		doi = matchCOinS_rft_dat(@$highlightContainer.html())
		if doi
			console.debug 'Found DOI in Primo COinS:', doi
			return done(null, [ doi ])
		doi = matchWiso(@$highlightContainer.html())
		if doi
			console.debug 'Found DOI in Wiso:', doi
			return done(null, [ doi ])
		if !@href
			doi = matchDOI(@$highlightContainer.html())
			if doi
				console.debug 'Found DOI in containing element: ', doi
				return done(null, [ doi ])
			if !@href
				console.error 'Cannot determine DOI without a URI.'
				return done('Cannot determine DOI without a URI.')
		doi = matchDOI(@href)
		if doi
			console.debug 'Found DOI in URL:', [ doi ]
			return done(null, [ doi ])
		else
			GM_xmlhttpRequest
				method: 'GET'
				url: ZOTERO_API + '?format=doi&url=' + @href
				onload: (response) ->
					if response.status != 200
						console.error response.status
						return done(response.status)
					console.debug 'Found DOI by scraping', response.responseText
					done null, [ response.responseText ]

	fetch: (cbFetch) ->
		if @flag_fetched
			return cbFetch(null, 'Already fetched')
		@flag_fetched = true
		if @button_type == 'result-list'
			@setStatus 'working'
			async.each @results, (result, done) ->
				console.log(result)
				if result.button.flag_fetched
					return done()
				result.button.activate ->
					result.button.fetch done
			, =>
				@setStatus 'ok'
				@render()
				cbFetch null, 'Fetched all results'
		else
			@setStatus 'working'
			@fetchDOI (err, dois) =>
				if err
					@setStatus 'fail', 'No DOI : ' + err
					return cbFetch('Can\'t fetch data without a DOI.')
				instantiated = []
				async.eachSeries dois, ((pubId, donePub) =>
					DB.get 'publications', pubId, (err, pub) =>
						if err
							@setStatus 'fail', 'Failed to download publication data: ' + err
						else
							@setStatus 'ok'
							instantiated.push pub
						donePub()
				), (err) =>
					@publications = instantiated
					@render()
					cbFetch null, 'fetched list items'

	activate: (cbActivate) ->
		if @status != 'inactive'
			return cbActivate(null, 'Already activated')
		@render()
		@setStatus 'working'
		if @button_type == 'result-list'
			@results = []
			@resultClass.activateResults @, (result, cbResult) =>
				@results.push result
				result.button.activate cbResult
			, =>
				@setStatus 'ready'
				cbActivate null, 'Activated all results'
		else
			@setStatus 'ready'
			cbActivate null, 'Activated'

	unexpandAll: ->
		SITE_BUTTON.expanded = false
		SITE_BUTTON.results.forEach (result) ->
			result.button.expanded = false
			result.button.renderPartially()
		SITE_BUTTON.renderPartially()

	unexpand: ->
		@expanded = true
		@toggleExpanded()

	toggleExpanded: ->
		wasExpanded = @expanded
		@unexpandAll()
		@expanded = !wasExpanded
		@renderPartially()
		LOG null, 'toggled menu'

	clickFetch: ->
		console.debug 'Fetching'
		@activate (->
			@fetch LOG
		).bind(this)

	clickLogo: ->
		if @status == 'inactive'
			return @activate(LOG)
		else if @status == 'ready'
			@fetch LOG
		else
			@toggleExpanded()

	clickQuit: ->
		$('style[scoped]').parent().remove()

	clickConfig: ->
		@unexpandAll()
		GM_config.open()

	toggleFilter: ->
		if FILTER.enabled
			@disableFilter()
		else
			@enableFilter()

	enableFilter: ->
		FILTER.enabled = true
		@unexpandAll()
		$('#infolis-filterbox').slideDown()
		$('#filter-input').focus()
		@updateFilter()

	disableFilter: ->
		FILTER.enabled = false
		@updateFilter()
		$('#filter-input').val ''
		$('#infolis-filterbox').slideUp()

	updateFilter: ->
		FILTER.text = new RegExp('.*' + $('#filter-input').val() + '.*', 'i')
		FILTER.databases = $('#filter-databases').is(':checked')
		FILTER.datasets = $('#filter-datasets').is(':checked')
		# SITE_BUTTON.results.forEach(function(result, idx) {
		# result.button.show();
		# });
		SITE_BUTTON.results.forEach (result, idx) ->
			if !FILTER.enabled
				return result.button.show()
			coll = undefined
			hidden = false
			if FILTER.databases and !result.button.list('databases').length
				hidden = true
			if FILTER.datasets and !result.button.list('datasets').length
				hidden = true
			if !hidden and FILTER.text
				hidden = true
				[
					'databases'
					'datasets'
				].forEach (coll) ->
					result.button.list(coll).forEach (data) ->
						# TODO other fields
						if FILTER.text.test(data.identifier) or FILTER.text.test(data.title)
							hidden = false
			if hidden
				result.button.hide()
			else
				result.button.show()
		SITE_BUTTON.renderPartially()

	renderPartially: ->
		# add class to scoped div
		if @button_type == 'result-list-item'
			@$el.css 'margin-top', '20px'
			@$el.css 'z-index', '99999'
			@$el.css 'overflow', 'visible'
			@$el.css 'min-width', '64px'
			@$el.css 'float', 'left'
			@prioritize()
		if this == SITE_BUTTON
			total = @results.length
			visible = total
			@results.forEach (result) ->
				if result.button.hidden
					visible -= 1
			$('#filter-status').html visible + ' / ' + total
		if @error_message
			$('.infolis-error', @$el).html(@error_message).toggle true
		$('.infolis-menu:first', @$el).toggleClass 'hidden', !@expanded
		$('.infolis-button:first', @$el).toggleClass 'expanded', @expanded
		$('.infolis-button:first', @$el).addClass 'infolis-' + @button_type
		$('.infolis-logo:first', @$el).attr 'data-infolis-number', @number_found()
		$('.infolis-button:first', @$el).attr 'data-infolis-status', @status
		$('span.infolis-status', @$el).html @status
		# toggle modals
		$('#btn-fetch-all', @$el).toggleClass 'hidden', @flag_fetched or @button_type != 'result-list'
		$('#filter-toggle', @$el).toggleClass 'hidden', @button_type != 'result-list'
		$('.infolis-result-length', @$el).toggleClass 'hidden', @button_type != 'result-list'
		$('.infolis-button-group', @$el).toggleClass 'hidden', @button_type == 'result-list-item'
		$('.infolis-row-databases', @$el).toggleClass 'hidden', @list('databases').length == 0
		$('.infolis-row-datasets', @$el).toggleClass 'hidden', @list('datasets').length == 0
		$('.infolis-row-publications', @$el).toggleClass 'hidden', @list('publications').length == 0

	render: ->
		# render template
		$('div.infolis-button', @$el).replaceWith tpl('site_button', this)
		if @number_found() > 0
			$('.infolis-logo:not(.expanded):first', @$el).addClass('animated wobble').one 'animationend', ->
				$(this).removeClass 'animated wobble'
		@renderPartially()
		# click/tap events
		$('.infolis-logo:first', @$el).on 'click tap', @clickLogo.bind(this)
		$('#btn-fetch-all', @$el).on 'click tap', @clickFetch.bind(this)
		$('#btn-quit', @$el).on 'click tap', @clickQuit.bind(this)
		$('#btn-config', @$el).on 'click tap', @clickConfig.bind(this)
		# Filtering
		$('#filter-toggle', @$el).on 'click tap', @toggleFilter.bind(this)
		$('#filter-clear', @$el).on 'click tap', @disableFilter.bind(this)
		$('#filter-input', @$el).on 'keyup', @updateFilter.bind(this)
		$('input[type=\'checkbox\']', @$el).on 'change', @updateFilter.bind(this)
		$('.filter-preset').on 'click tap', ->
			collection = $(this).closest('*[data-collection]').attr('data-collection')
			id = $(this).closest('*[data-collection]').attr('data-id')
			SITE_BUTTON.enableFilter()
			$('#infolis-filterbox input[type=\'text\']').val id
			$('input[type=\'checkbox\']').prop 'checked', false
			$('#filter-' + collection).prop 'checked', true
			SITE_BUTTON.updateFilter()
		# ribbons/badges/whatever toggler
		$('.infolis-menu:first .toggle-group', @$el).each ->
			group = this
			$(group).find('.toggle-source').on 'click tap', ->
				$('.toggle-target', group).animate {
					'opacity': 'toggle'
					'width': 'toggle'
				}, 100
		# biblio export
		$('.export', @$el).on 'click tap', ->
			format = $(this).attr('data-export')
			collection = $(this).closest('*[data-collection]').attr('data-collection')
			id = $(this).closest('*[data-collection]').attr('data-id')
			# var entry      = DB.get(collection, id);
			DB.get collection, id, (err, entry) ->
				if entry
					SITE_BUTTON.unexpandAll()
					$('#citation-window').append($('<pre>').html(htmlEncode(if entry['citation_' + format] then entry['citation_' + format] else JSON.stringify(entry, null, 2)))).show()

###
# CSS for config dialog
###


###
# Config values
###

GM_config.init
	id: SCRIPT_ID
	title: 'Configure InfolisButton'
	fields:
		auto_activate:
			label: 'Activate on page load?'
			type: 'checkbox'
			default: false
		auto_fetch:
			label: 'Automatically fetch after activating?'
			type: 'checkbox'
			default: false
		bad_databases:
			label: 'Low Priority databases'
			type: 'textarea'
			rows: 4
			default: [ 'yahoo' ].join('\n')
		good_databases:
			label: 'High Priority databases'
			type: 'textarea'
			rows: 4
			default: [
				'bloomberg'
				'gfd'
			].join('\n')
		regex_doi:
			'label': 'DOI Regex'
			'type': 'text'
			'default': '\\b(10\\.[0-9]{4,}/[^\\s&"\']*[^\\s&"\'.,])\\b'
	events: open: (configDocument, configWindow) ->
		# console.debug(CONFIG_FRAME_STYLE);
		@frame.setAttribute 'style', CONFIG_FRAME_STYLE
		configDocument.addEventListener 'keydown', (e) ->
			if e.which == 27
				# GM_config.save();
				GM_config.close()

		DOLLAR = (arg) ->
			$ arg, configDocument

		DOLLAR('style').html CONFIG_CSS
		DOLLAR('head').append($('<link rel=\'stylesheet\'>').attr('href', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css')).append($('<script>').attr('src', 'http://code.jquery.com/jquery-latest.js')).append $('<script>').attr('src', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js')
		DOLLAR('body > div > div:last-child').attr 'style', 'position:fixed; right:0; top: 0;'
		DOLLAR('div.config_header').html $('<div class=\'col-sm-12\'>').append($('<h2>').html(DOLLAR('div.config_header').html()))
		DOLLAR('div.section_header').hide()
		DOLLAR('.config_var').each ->
			DOLLAR(this).html $('<div class=\'form-group\'>').append($('<div class="col-sm-3">').append($('label', this))).append($('<div class="col-sm-9">').append($('*:last-child', this)))
			DOLLAR(this).append $('<div style=\'clear:both\'>')
		DOLLAR('body > div').addClass 'container'
		# DOLLAR("body > div > div");
		DOLLAR('button[id$=\'closeBtn\']').remove()
		DOLLAR('a.reset').remove()
		DOLLAR('textarea,input').addClass 'form-control'
		DOLLAR('button').addClass('btn btn-lg btn-success').text 'Save'
		DOLLAR('button').on 'click tap', GM_config.close.bind(GM_config)
		$('body').one 'click tap', GM_config.close.bind(GM_config)
		DOLLAR('body').append '<a id="restart-zotero-backend" class="btn btn-danger">Reset</a>'
		DOLLAR('#restart-zotero-backend').on 'click tap', ->
			GM_xmlhttpRequest
				method: 'GET'
				url: ZOTERO_API + '/restart'
				onload: (response) ->
					console.warn response
					console.warn 'Notified zotero backend!'


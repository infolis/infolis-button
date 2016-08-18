###*
# Key bindings
#
###

addKeybindings = ->
	document.addEventListener 'keydown', (e) ->
		# key: <escape>
		if e.which == 27
			if GM_config.frame
				GM_config.close()
			SITE_BUTTON.unexpandAll()
			SITE_BUTTON.disableFilter()
			$('#citation-window').hide()
			# key: <alt-c>
		else if e.which == 'C'.charCodeAt(0) and e.altKey == true
			SITE_BUTTON.clickConfig()
			# GM_config.open();
			# key: <alt-b>
		else if e.which == 'B'.charCodeAt(0) and e.altKey == true
			SITE_BUTTON.clickFetch()
			# key: <alt-v>
		else if e.which == 'V'.charCodeAt(0) and e.altKey == true
			$('.infolis-button').hide()
			# key: <alt-m>
		else if e.which == 'M'.charCodeAt(0) and e.altKey == true
			SITE_BUTTON.toggleFilter()
			# key: <alt-n>
		else if e.which == 'N'.charCodeAt(0) and e.altKey == true
			if window.confirm('Really nuke the config?')
				GM_config.fields.forEach (id) ->
					GM_config.fields[id].value = GM_config.fields[id].default
				GM_config.write()



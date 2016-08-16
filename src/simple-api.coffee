###
# Simple Database
###

SimpleApi = ->

SimpleApi::get = (coll, id, cb) ->
	console.log 'yay'
	GM_xmlhttpRequest
		method: 'GET'
		url: BUTTON_DATA_API + '/' + coll + '?identifier=' + id
		onload: (response) ->
			# console.log("Retrieve from backend: ", coll, id, response.responseText);
			if response.status != 200
				# return cb(null, {'identifier': id});
				return cb(response.status)
			pub = JSON.parse(response.responseText)
			async.each [
				'datasets'
				'databases'
			], ((coll, doneColl) ->
				async.map pub[coll] or [], ((id, doneId) ->
					DB.get coll, id, doneId
				), (err, instantiated) ->
					if !err and instantiated.length
						pub[coll] = instantiated
					doneColl err
			), (err) ->
				cb null, pub


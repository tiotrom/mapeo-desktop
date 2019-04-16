import xhr from 'xhr'
import { remote } from 'electron'
import querystring from 'querystring'

const osmServerHost = 'http://' + remote.getGlobal('osmServerHost')

module.exports = {
  stop,
  destroy,
  leave,
  listen,
  join,
  getTargets,
  start,
  createMedia,
  create,
  update,
  del,
  list,
  convert
}

function destroy (cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/destroy`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    return cb(null, body)
  })
}

function leave (cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/leave`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    return cb(null, body)
  })
}

function join (cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/join`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    return cb(null, body)
  })
}


function listen (cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/listen`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    return cb(null, body)
  })
}

function getTargets (cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/peers`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    try {
      var data = JSON.parse(body)
      if (data.topic === 'peers') return cb(null, data.message)
      else return cb(new Error('unknown response', data))
    } catch (err) {
      return cb(err)
    }
  })
}

function stop (target, cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/stop`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    cb(null, body)
  })
}

function start (target, cb) {
  var opts = {
    method: 'GET',
    url: `${osmServerHost}/sync/start?${querystring.stringify(target)}`
  }
  xhr(opts, function (err, res, body) {
    if (err) return cb(err)
    cb(null, body)
  })
}

function createMedia (buf, cb) {
  var opts = {
    url: `${osmServerHost}/media`,
    method: 'POST',
    body: buf
  }
  xhr(opts, cb)
}

function del (f, cb) {
  // Delete
  var opts = {
    url: `${osmServerHost}/observations/${f.id}`,
    method: 'DELETE'
  }
  xhr(opts, cb)
}

function create (f, cb) {
  var opts = {
    url: `${osmServerHost}/observations`,
    method: 'POST',
    body: f,
    json: true
  }
  xhr(opts, cb)
}

function update (f, cb) {
  var opts = {
    url: `${osmServerHost}/observations/${f.id}`,
    method: 'PUT',
    body: f,
    json: true
  }
  xhr(opts, cb)
}

function list (cb) {
  xhr(`${osmServerHost}/observations`, cb)
}

function convert (f, cb) {
  var opts = {
    url: `${osmServerHost}/observations/to-element/${f.id}`,
    method: 'PUT'
  }
  xhr(opts, cb)
}

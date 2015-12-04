Chats = new Mongo.Collection('chats')
Dots = new Mongo.Collection('dots')

r = i => Math.random() * i <<0
random_color = () => `hsla(${r(360)}, 100%, 75%, 1)`
function notify(chat) {
  if (!document.hidden) {
    return
  }
  var text = `${chat.user} says ${chat.text}`
  document.title = text

  if (Notification.permission === "granted") {
    var notification = new Notification(text)
    notification.addEventListener('click', e => {
      window.focus()
      notification.close()
    })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        notify(chat)
      }
    })
  }
}

if (Meteor.isClient) {
  var init = true,
      canvas = null,
      ctx = null
  Meteor.subscribe("userData")
  Meteor.subscribe("dots")
  Meteor.subscribe("chats", () => init = false)

  Template.body.helpers({
    chats: Chats.find({}, {sort: {ts: -1}}),
    users: Meteor.users.find()
  })

  Template.body.events({
    "submit .chat-input": event => {
      event.preventDefault()
      var text = event.target.chat.value
      if (text && text[0] == '/') {
        text = '/clear'
        Meteor.call('clearDots')
      } else {
        Meteor.call('talk', text)
      }
      event.target.chat.value = ""
    },
    "change .color": event => {
      Meteor.call('changeColor', event.target.value)
    },
    "click .chats": e => document.querySelector('.chat-prompt').focus()
  })

  Template.canvas.onRendered(function () {
    canvas = this.firstNode
    ctx = canvas.getContext('2d')
    canvas.width = canvas.parentNode.clientWidth
    canvas.height = canvas.parentNode.clientHeight
  })

  var drawing = false
  Template.canvas.events({
    'mousedown .canvas': event => drawing = true,
    'mouseup .canvas': event => drawing = false,
    'mousemove .canvas': event => {
      if (!drawing) {
        return
      }
      Meteor.call('drawDot', event.offsetX, event.offsetY)
    }
  })

  Template.chat.helpers({
    timestamp: function () {
      return this.ts.toLocaleString()
    }
  });

  Tracker.autorun(() => {
    var chats = document.querySelector('.chat-list')

    if (chats) {
      chats.scrollTo(Infinity)
    }

  })
  Chats.find().observeChanges({
    added: function (id, chat) {
      if(init) {
        return
      }
      if (Meteor.user() && Meteor.user().username != chat.user) {
        notify(chat)
      }
    }
  })
  Dots.find().observeChanges({
    added: function (id, dot) {
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.fillStyle = dot.color
      ctx.arc(dot.x, dot.y, 5, 2 * Math.PI, false)
      ctx.fill()
    },
    removed: function (id) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  })

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  })
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      document.title = "Public chat based on meteor"
    }
  })
}

Meteor.methods({
  talk: chat => {
    if (!Meteor.userId() || !chat) {
      return
    }
    if (!Meteor.user().color) {
      Meteor.users.update(Meteor.userId(), {$set: {color: random_color()}})
    }
    Chats.insert({
      text: chat,
      user: Meteor.user().username,
      color: Meteor.user().color,
      ts: new Date()
    })
  },
  changeColor: color => {
    Meteor.users.update(Meteor.userId(), {$set: {color: color}})
  },
  drawDot: (x, y) => {
    Dots.insert({
      x,
      y,
      user: Meteor.user().username,
      color: Meteor.user().color,
      ts: new Date()
    })
  },
  clearDots: () => Dots.remove({})
})

if (Meteor.isServer) {
  Meteor.users.allow({
    update: function (userId, doc, fields, modifier) {
      return true
    }
  })
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({
      }, {
        fields: {'username': 1, 'color': 1}
      })
    } else {
      this.ready()
    }
  })
  Meteor.publish("chats", function () {
    return Chats.find({}, {sort: {ts: -1}, limit: 100})
  })
  Meteor.publish("dots", function () {
    return Dots.find({}, {sort: {ts: 1}})
  })
  Meteor.startup(function () {})
}

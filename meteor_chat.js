Chats = new Mongo.Collection('chats')

r = i => Math.random() * i <<0
random_color = () => `hsla(${r(360)}, 100%, 75%, 1)`

function notify(chat) {
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
  var init = true
  Meteor.subscribe("userData")
  Meteor.subscribe("chats", () => init = false)

  Template.body.helpers({
    chats: Chats.find({}, {sort: {ts: -1}, limit: 100}),
    users: Meteor.users.find()
  })

  Template.body.events({
    "submit .chat-input": event => {
      event.preventDefault()
      Meteor.call('talk', event.target.chat.value)
      event.target.chat.value = ""
    },
    "change .color": event => {
      Meteor.call('changeColor', event.target.value)
    },
    "click .chats": e => document.querySelector('.chat-prompt').focus()
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

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
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
  }
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
    return Chats.find()
  })
  Meteor.startup(function () {})
}

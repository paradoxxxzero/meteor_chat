Chats = new Meteor.Collection('chats')

r = i => Math.random() * i <<0
random_color = () => `hsla(${r(360)}, 100%, 75%, 1)`

if (Meteor.isClient) {
  Template.body.helpers({
    chats: Chats.find({}, {sort: {ts: -1}})
  })

  Template.body.events({
    "submit .chat-input": (event) => {
      event.preventDefault()
      if (!event.target.chat.value) {
        return
      }

      Chats.insert({
        text: event.target.chat.value,
        color: random_color(),
        ts: new Date() // current time
      })
      event.target.chat.value = ""
    }
  })

  Template.chat.helpers({

  });

  Tracker.autorun(() => {
    var chats = document.querySelector('.chats');
    if (chats) {
      chats.scrollTo(Infinity)
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

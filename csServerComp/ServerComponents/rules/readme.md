# Type of rules

## Conditions

### Time based

1. After a certain time
2. At a certain time

### Event based

An event is either a key/namespace of the event, optionally a subject, and a value

1. When an event is raised, optionally with a certain subject.

### Property based

1. When a certain property

## Actions

### Sending a message (feature update)

### Activating or deactivating rules


## Examples

* Time: Time progresses and messages / feature updates are sent.

"_rules": [{
    "id": "rule1",
    "desc": "Add the item after a certain amount of time (after activation)",
    "isActive": true,
    "actions": [{ "add", 20 }] // add the feature after 60s (that the condition becomes true)
}]

* Request: A question is asked about the social security number. The system responds, after a delay, with an answer.

"_rules": [{
    "actions": [{ "add", 60 }] // add the feature after 60s (that the condition becomes true)
}, {
    "conditions": [{ "property", "bsn" }, { "property", "isAnswered", false }, { "property", "assigned" }]
    "actions": [{ "set", "bsn", 123, 30 }, { "set", "isAnswered", true, 30 }] // set property to value after delay
}]

event: { "name": "bsn", "subject": "question", "isAnswered": false }
During the evaluation of the event, the feature.properties["isAnswered"] is compared to false.

action (context = feature): activateRule(feature, "isAnswered": true, "bsn": "123", delay = 60s);

* Request: The walking route is requested. In response, a route (polyline) is provided.

"_rules": [{
    "actions": [{ "add", 20 }] // add the feature after 60s (that the condition becomes true)
}, {
    "conditions": [{ "property", "bsn" }, { "property", "isAnswered", false }, { "property", "assigned" }]
    "actions": [{ "set", "bsn", 123, 30 }, { "set", "isAnswered", true, 30 }] // set property to value after delay
}]

conditions: [{ "property", "route" }, { "property", "isAnswered", false }, { "property", "assigned" }]
actions: [{ "add", 60 }] // add the feature after 60s (that the condition becomes true)

Do we evaluate the condition again before executing the action, e.g. when it has been recalled?.3..

.0.
0..

0..
0.20

* Request: An image is requested. In response, an image is provided.

* Action: A site or shop should be inspected by an actor. In response, the site/shop is visited by an actor and a result is sent (kid (not) found).

* Action: The wife / neighbor / school / wijkagent should be called. The result of this call is returned.

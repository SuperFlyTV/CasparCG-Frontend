# CasparCG Frontend Server Configurations

Although the CasparCG Frontend App was built for version 2.2.0, the server definitions can define any server version. 

## Defining Groups

To define a group, you can create a new object and add all of the data required as a child. </br>

An array of options will create a group that can have multiple subgroups.
```json
{
    "MyNewGroup": {},
    "MyNewGroupOfOptions": [{}]
}
```

An example of sub groups is `channel` within the `channels` object.

```json
// json/versions/v2.2.0.json
{
    "channels":[{
        "DataForChannel": {}
    }]
}
```

There are two type of sub groups; single and multi. A single sub group is like the channel show above. You can only add a new `channel` to the `channels` object. 

Let's look at a multi group definition and break it down.

```json
{
    "consumers": [
        {
            "_name": "decklink",
            "device": {},
            "key-device": {},
           
        }, {
            "_name": "bluefish",
            "device": {},
            "sdi-stream": {},
           
        }, {
            "_name": "system-audio",
            "channel-layout":{},
            "latency": {}
        }
    ]
}
```

This section is defining 3 consumers that will be called `decklink`, `bluefish` and `system-audio` (We will get back to the `_name` and empty objects later). When this gets added to a configuration, it will create a list in the parent element. The list will contain each option with an `_name` property.

## Defining Data

Up till now all of our examples have had empty objects for the key's properties. Inside those objects is where you define the type of data and any other attributes. Let's see an example.

```json
{
    "channels": [{
        "device": {"_type": "number", "_required": true}
    }]
}
```

This snippet is defining a single group of channels. Each channel will have a piece of data called `device` and it will be a `number` that is `required`. All of the keys are required to start with an underscore or the object will be considered a parent object, not data.

There are a few other options and requirements which are defined below. 

- `_type`: `string`, `number`, `list`, or `boolean`
- `_dfualt`: The default value
- `_required`: `true` or `false`
- `_options`: An array of options to be used within the list. This is required when using `_type: list`

Examples: 

```json
// List
{
    "channel-layout": {"_type": "list", "_options": ["mono", "stereo", "matrix", "8ch", "16ch"]}
}
// Boolean
{
    "straight-alpha-output": {"_type": "boolean", "_default": false}
}
```
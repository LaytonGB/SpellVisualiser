# SpellVisualiser
An easy to use API that accurately renders the area that a spell should affect.

---

### Accuracy
This API is currently configured to a 3.5E D&D measurement system. Other systems will be coming soon.

---

### Commands

#### `!sv <shape> <radius>`
- Shape can be "sphere" or "cone". More shapes coming soon.
- Radius must be in game units, depending on the current page's configuration.

This command renders an accurately shaped Path that can be moved by any player. The path is generated around a selected token.

If the generated path is selected, running `!sv` will attempt to convert the path to a grid-based shape.

---

#### `!svfast <shape> <radius>`
- Shape must be "sphere". More shapes coming soon.
- Radius must be in game units, depending on the current page's configuration.

This command is a faster rendition of `!sv`. It immediately renders a gridded shape around the selected token.

---
Created by Layton.

Contact me [via Roll20](https://app.roll20.net/users/1519557/layton) or [submit a GitHub Issue](https://github.com/LaytonGB/SpellVisualiser/issues/new/choose).

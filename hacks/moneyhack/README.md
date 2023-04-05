# Money Hack

Finds the most recent file in your save backup directory, base64 decodes it into JSON, gives you a shitload of money, and then saves the updated save to a new JSON file.

## Usage

1. Export a save from the game into your backup directory
2. Run `node moneyhack.js` or `npm run moneyhack`
3. Import the new JSON file into the game and confirm to overwrite the changes

## Notes

- You can always just reimport your backup if something goes wrong
- Sometimes it seems like it takes two tries to get a save to import? I may just be dumb.

### Ideas

If this was an API with an endpoint that would do this automatically, I could probably make a request to it from inside the game, then possibly manipulate the UI to automatically import? It's possible to export a save from the game with the singularity API
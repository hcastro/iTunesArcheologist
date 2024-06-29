import { promises as fs } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

async function excavatePlaylists(xmlFile) {
  try {
    console.log('Initiating playlist excavation...');
    const data = await fs.readFile(xmlFile, 'utf8');
    const result = await parseXml(data);

    const playlists = result.plist.dict[0].dict[0].dict.filter(item =>
      item.key && item.key.includes('Playlist ID')
    );

    return playlists.map(playlist => {
      const name = playlist.string.find(str => str);
      const id = playlist.integer.find(int => int);
      const persistentId = playlist.string.find((str, index) =>
        playlist.key[index] === 'Playlist Persistent ID'
      );
      const trackIds = playlist.array ?
        playlist.array[0].dict.map(track => parseInt(track.integer[0])) :
        [];

      return {
        name,
        id: parseInt(id),
        persistentId,
        trackIds
      };
    });
  } catch (error) {
    console.error('Excavation failed:', error);
    throw error;
  }
}

async function main() {
  const xmlFile = process.argv[2];
  if (!xmlFile) {
    console.error('Please provide the path to your iTunes XML artifact');
    process.exit(1);
  }

  try {
    const playlists = await excavatePlaylists(xmlFile);
    console.log('Excavation complete. Discovered artifacts:', playlists);
  } catch (error) {
    console.error('Excavation operation failed:', error);
  }
}

main();
import { writeFileSync, readFileSync, readdirSync, lstatSync } from 'fs';
import path from 'path';

const orderRecentFiles = dir => {
  return readdirSync(dir)
    .filter(file => lstatSync(path.join(dir, file)).isFile())
    .map(file => ({ file, mtime: lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

const getMostRecentFile = dir => {
  const files = orderRecentFiles(dir);
  return files.length ? files[0] : undefined;
};

const saveBackupDirectory = 'B:\\other\\games\\bitburner';
('');

const mostRecentSave = getMostRecentFile(saveBackupDirectory);

if (mostRecentSave) {
  const saveBase64 = readFileSync(path.join(saveBackupDirectory, mostRecentSave.file), 'utf8');
  const encoded = atob(saveBase64);
  const saveData = JSON.parse(encoded);
  const playerSave = JSON.parse(saveData.data.PlayerSave);

  console.log(playerSave);

  const currentMoney = playerSave.data.money;
  const newMoney = currentMoney * 10000000000000;
  playerSave.data.money = newMoney;

  saveData.data.PlayerSave = JSON.stringify(playerSave);
  const newSave = btoa(JSON.stringify(saveData));
  writeFileSync('newsave.json', newSave, err => {
    if (err) {
      console.log('Error writing file', err);
    } else {
      console.log('Successfully wrote file');
    }
  });
}

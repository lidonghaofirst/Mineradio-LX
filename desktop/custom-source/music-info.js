function platformKey(song) {
  const provider = String(song?.provider || song?.source || '').toLowerCase();
  if (provider === 'qq' || provider === 'tx') return 'tx';
  if (provider === 'netease' || provider === 'wy') return 'wy';
  return null;
}

function formatInterval(raw) {
  let seconds = Number(raw) || 0;
  if (seconds > 10000) seconds /= 1000;
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function toLxMusicInfo(song) {
  const source = platformKey(song);
  if (!source) throw new Error('SOURCE_UNSUPPORTED: Unknown Mineradio provider');
  const songId = source === 'tx' ? (song.mid || song.songmid || song.id) : song.id;
  if (songId == null || songId === '') throw new Error('SOURCE_UNSUPPORTED: Missing song id');
  const albumId = song.albumMid || song.albumId || '';
  const meta = {
    songId,
    albumName: String(song.album || ''),
    albumId,
    picUrl: song.cover || null,
    qualitys: [],
    _qualitys: {},
  };
  if (source === 'tx') {
    meta.strMediaMid = String(song.mediaMid || song.media_mid || song.strMediaMid || song.songId || songId);
    meta.id = Number(song.qqId || song.songId || 0) || undefined;
    meta.albumMid = String(song.albumMid || song.album_mid || albumId);
  }
  return {
    id: String(song.id ?? songId),
    name: String(song.name || song.title || ''),
    singer: String(song.artist || ''),
    source,
    interval: formatInterval(song.duration || song.dt || song.interval),
    meta,
    songmid: songId,
    albumId,
    strMediaMid: meta.strMediaMid || '',
    copyrightId: '',
    hash: '',
  };
}

module.exports = { platformKey, formatInterval, toLxMusicInfo };

// Import necessary packages
require('dotenv').config(); // Load environment variables from .env file

// Retrieve the token from environment variables
const token = process.env.SPOTIFY_TOKEN;

async function fetchWebApi(endpoint, method, body) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function getTopTracks() {
  return (await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET')).items;
}

async function getRecommendations(topTracksIds) {
  return (await fetchWebApi(`v1/recommendations?limit=5&seed_tracks=${topTracksIds.join(',')}`, 'GET')).tracks;
}

async function createPlaylist(tracksUri) {
  const { id: user_id } = await fetchWebApi('v1/me', 'GET');

  const playlist = await fetchWebApi(
    `v1/users/${user_id}/playlists`, 'POST', {
      "name": "My recommendation playlist",
      "description": "Playlist created by the tutorial on developer.spotify.com",
      "public": false
    }
  );

  await fetchWebApi(
    `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
    'POST'
  );

  return playlist;
}

async function main() {
  try {
    const topTracks = await getTopTracks();
    const topTracksIds = topTracks.map(track => track.id);
    console.log('Top Tracks:', topTracks.map(({ name, artists }) => `${name} by ${artists.map(artist => artist.name).join(', ')}`));

    const recommendedTracks = await getRecommendations(topTracksIds);
    console.log('Recommended Tracks:', recommendedTracks.map(({ name, artists }) => `${name} by ${artists.map(artist => artist.name).join(', ')}`));

    const tracksUri = [
      ...topTracks.map(track => `spotify:track:${track.id}`),
      ...recommendedTracks.map(track => `spotify:track:${track.id}`)
    ];

    const createdPlaylist = await createPlaylist(tracksUri);
    console.log(`Created Playlist: ${createdPlaylist.name}, ID: ${createdPlaylist.id}`);
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

// Execute the main function
main();
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native'
import { StorageAccessFramework } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export default function Recorder() {
    const [internalFolderUri, setInternalFolderUri] = useState("");
    const [cacheRecordings, setCacheRecordings] = useState([]);
    const [sound, setSound] = useState();

    useEffect(() => {
        return sound
          ? () => {
              console.log('Unloading Sound');
              sound.unloadAsync(); }
          : undefined;
      }, [sound]);

    async function getFiles() {
        try {
            const album = StorageAccessFramework.getUriForDirectoryInRoot("mirecorder");

            // Requests permissions for external directory
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(album);

            if (permissions.granted) {
                // Gets SAF URI from response
                const albumUri = permissions.directoryUri;

                // check that the correct folder was selected - test this later
                if (!albumUri.includes("mirecorder")) {
                    return;
                }

                const mediaLibraryPermissions = await MediaLibrary.requestPermissionsAsync();
                if (!mediaLibraryPermissions.granted) {
                    return;
                }

                // delete previous cache folder along with contents so cache is up-to-date with media library assets
                const cDir = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + "mirecorder");
                if (cDir.exists) {
                    await FileSystem.deleteAsync(cDir.uri);
                }

                // Copies files from external storage to internal cache storage 
                await StorageAccessFramework.copyAsync({
                    from: albumUri,
                    to: FileSystem.cacheDirectory,
                }); 

                const outputDir = FileSystem.cacheDirectory + "mirecorder";
                setInternalFolderUri(outputDir); // most likely not needed, but saved for now

                // filenames in the internal cache storage
                const outputContents = await FileSystem.readDirectoryAsync(outputDir);
                setCacheRecordings(outputContents);
            }

        } catch (err) {
            console.error(err);
        }
    }

    async function playClip(clipUri) {
        try {
            const album = await MediaLibrary.getAlbumAsync('mirecorder');
            const assetTable = await MediaLibrary.getAssetsAsync({ mediaType: "audio", album: album});
            const asset = assetTable.assets[1];

            // works, TODO: filename utilization

            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            console.log('Playing Sound');
            await sound.playAsync();

        } catch (err) {
            console.error(err);
        }
    }

    function renderPlaylist() {
        return cacheRecordings.map((clip, index) => {
            return (
                <View key={index} style={styles.row}>
                    <Text style={styles.fill}>Clip {index + 1}</Text>
                    <Button style={styles.button} onPress={() => playClip(clip)} title="Play" />
                </View>
            );
        });
    }

    return (
        <View style={styles.container}>
            <Button title="Get Local Files" onPress={getFiles} />
            {/*<Button title="Get Local Uri" onPress={() => alert(internalFolderUri)} />*/}
            <Text>Playlist</Text>
            {renderPlaylist()}
            <StatusBar style="auto" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fill: {
        flex: 1,
        margin: 16
    },
    button: {
        margin: 16
    }
});
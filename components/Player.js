import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native'
import { StorageAccessFramework } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export default function Recorder() {
    const [internalFolderUri, setInternalFolderUri] = useState("");
    const [cacheRecordings, setCacheRecordings] = useState([]);

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

                // Copies files from external storage to internal cache storage
                await StorageAccessFramework.copyAsync({
                    from: albumUri,
                    to: FileSystem.cacheDirectory,
                });

                const outputDir = FileSystem.cacheDirectory + "mirecorder";
                setInternalFolderUri(outputDir);

                // filenames in the internal cache storage
                const outputContents = await FileSystem.readDirectoryAsync(outputDir);
                setCacheRecordings(outputContents);

                // Creates assets from local files
                /* const [newAlbumCreator, ...assets] = await Promise.all(
                    migratedFiles.map < Promise < MediaLibrary.Asset >> (
                        async fileName => await MediaLibrary.createAssetAsync(outputDir + '/' + fileName)
                    )
                );

                // Album was empty
                if (!newAlbumCreator) {
                    return;
                }

                // Creates a new album in the scoped directory
                const newAlbum = await MediaLibrary.createAlbumAsync("mirecorder-assets", newAlbumCreator, false);
                if (assets.length) {
                    await MediaLibrary.addAssetsToAlbumAsync(assets, newAlbum, false);
                } */
            }

        } catch (err) {
            console.error(err);
        }
    }

    async function playClip(clipUri) {
        try {
            const assetTable = await MediaLibrary.getAssetsAsync({ mediaType: "audio" });
            const asset = assetTable.assets[0];
            // , after: "39"
            // const seconduri = internalFolderUri + "/" + clipUri;

            // works in debug mode, otherwise not. Observe status in a state, maybe dependent on that?
            // also, file render needs fixing

            const { sound } = await Audio.Sound.createAsync(asset);

            const status = await sound.getStatusAsync();
            if (status.isLoaded) console.log("loaded")
            await sound.playAsync();
            const play = await sound.getStatusAsync()
            if (play.isPlaying) console.log("is playing")
            await sound.unloadAsync();
            const not = await sound.getStatusAsync();
            if (!not.isLoaded) console.log("is not loaded")            
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
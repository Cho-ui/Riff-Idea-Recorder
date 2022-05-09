import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native'
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';


export default function Recorder() {
    const [sound, setSound] = useState();
    const [audioAssets, setAudioAssets] = useState([]);
    const [shouldRender, setShouldRender] = useState();

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    useEffect(() => {
        setShouldRender(undefined);
    }, [shouldRender])

    async function getFiles() {
        try {
            const mediaLibraryPermissions = await MediaLibrary.requestPermissionsAsync();
            if (!mediaLibraryPermissions.granted) {
                return;
            }

            // get media asset objects from external "mirecorder"-album
            const assetAlbum = await MediaLibrary.getAlbumAsync('mirecorder');
            const assetTable = await MediaLibrary.getAssetsAsync({
                mediaType: "audio",
                album: assetAlbum,
                first: 500
            }); // 500 files per PagedInfo page, if more files, needs a higher limit

            setAudioAssets(assetTable.assets);
        } catch (err) {
            console.error(err);
        }
    }

    async function playClip(asset) {
        try {
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err)
        }
    }

    async function playNext(asset, assetIndex) {
        try {
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
                const nextIndex = assetIndex + 1;
                if (playbackStatus.didJustFinish && nextIndex < audioAssets.length) {
                    playNext(audioAssets[nextIndex], nextIndex);
                }
            })
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err);
        }
    }

    async function playAll() {
        try {
            const asset = audioAssets[0];
            const assetIndex = 0;
            const { sound } = await Audio.Sound.createAsync(asset);
            setSound(sound);
            sound.setOnPlaybackStatusUpdate((playbackStatus) => {
                if (playbackStatus.didJustFinish) {
                    const nextIndex = assetIndex + 1;
                    playNext(audioAssets[nextIndex], nextIndex);
                };
            });
            console.log('Playing Sound');
            await sound.playAsync();
        } catch (err) {
            console.error(err);
        }
    }

    function moveUp(index) {
        if (index != 0) {
            const asset = audioAssets[index];
            let assetArrayCopy = audioAssets;
            assetArrayCopy.splice(index, 1);
            assetArrayCopy.splice((index - 1), 0, asset);
            setAudioAssets(assetArrayCopy);
            setShouldRender(true);
        }
    }

    return (
        <View style={styles.container}>
            <Button title="Get Local Files" onPress={getFiles} />
            <Button title="Play All" onPress={playAll} />
            <Text>Playlist</Text>
            <FlatList
                data={audioAssets}
                extraData={audioAssets}
                keyExtractor={(item) => item.filename}
                renderItem={({ item, index }) => (
                    <View style={styles.row}>
                        <Text style={styles.cliptext}>Clip {index + 1}</Text>
                        <Button style={styles.button} onPress={() => moveUp(index)} title="Up" />
                        <Button style={styles.button} title="Down" />
                        <Button style={styles.button} onPress={() => playClip(item)} title="Play" />
                        <Button style={styles.button} title="Share" />
                    </View>
                )} />
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
    cliptext: {
        marginRight: 16
    },
    button: {
        marginRight: 10
    }
});
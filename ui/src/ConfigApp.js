
import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, TextField, Button, List, ListItem, ListItemText, IconButton, Slider, Input, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const API_URL = 'http://localhost:3001/api';


function ConfigApp() {
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [newThreshold, setNewThreshold] = useState('');
    const [newVolume, setNewVolume] = useState(1);
    const [newSound, setNewSound] = useState(null);
    const [threshold, setThreshold] = useState(3);
    const [editIdx, setEditIdx] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ word: '', threshold: '', volume: 1, sound: null });

    useEffect(() => {
        fetch(`${API_URL}/config`).then(res => res.json()).then(cfg => {
            setKeywords(cfg.keywords || []);
            setThreshold(cfg.globalThreshold || 3);
        });
    }, []);

    const handleAddKeyword = async () => {
        if (!newKeyword || !newSound) return;
        const formData = new FormData();
        formData.append('word', newKeyword);
        if (newThreshold) formData.append('threshold', newThreshold);
        if (newVolume) formData.append('volume', newVolume);
        formData.append('sound', newSound);
        const res = await fetch(`${API_URL}/keywords`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        setKeywords(data.keywords);
        setNewKeyword('');
        setNewThreshold('');
        setNewVolume(1);
        setNewSound(null);
    };

    const handleRemoveKeyword = async (idx) => {
        await fetch(`${API_URL}/keywords/${idx}`, { method: 'DELETE' });
        setKeywords(keywords.filter((_, i) => i !== idx));
    };

    const handleEditKeyword = (idx) => {
        setEditIdx(idx);
        setEditData({
            word: keywords[idx].word,
            threshold: keywords[idx].threshold || '',
            volume: keywords[idx].volume || 1,
            sound: null
        });
        setEditDialogOpen(true);
    };

    const handleEditDialogSave = async () => {
        const formData = new FormData();
        if (editData.word) formData.append('word', editData.word);
        if (editData.threshold) formData.append('threshold', editData.threshold);
        if (editData.volume) formData.append('volume', editData.volume);
        if (editData.sound) formData.append('sound', editData.sound);
        const res = await fetch(`${API_URL}/keywords/${editIdx}`, {
            method: 'PUT',
            body: formData
        });
        const data = await res.json();
        const updated = [...keywords];
        updated[editIdx] = data.keyword;
        setKeywords(updated);
        setEditDialogOpen(false);
    };

    const handleThresholdChange = (e, value) => {
        setThreshold(value);
        fetch(`${API_URL}/globalThreshold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ globalThreshold: value })
        });
    };



    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Sound Streak Bot Config</Typography>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">Add Keyword</Typography>
                    <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={6} sm={4}>
                            <TextField label="Keyword" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={3} sm={2}>
                            <TextField label="Threshold" type="number" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ px: 1 }}>
                                <Typography gutterBottom>Volume: {newVolume}</Typography>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={Number(newVolume)}
                                    onChange={(_, value) => setNewVolume(value)}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Input type="file" onChange={e => setNewSound(e.target.files[0])} fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={12}>
                            <Button variant="contained" onClick={handleAddKeyword} fullWidth>Add</Button>
                        </Grid>
                    </Grid>
                    <List>
                        {keywords.map((k, i) => (
                            <ListItem key={i} secondaryAction={
                                <>
                                    <IconButton edge="end" onClick={() => handleEditKeyword(i)}><EditIcon /></IconButton>
                                    <IconButton edge="end" onClick={() => handleRemoveKeyword(i)}><DeleteIcon /></IconButton>
                                </>
                            }>
                                <ListItemText
                                    primary={k.word}
                                    secondary={
                                        <Grid container spacing={1} alignItems="center">
                                            <Grid item xs={8} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <span title={k.sound}><b>Sound:</b> {k.sound}</span>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <span><b>Vol:</b> {k.volume} <b>Thr:</b> {k.threshold}</span>
                                            </Grid>
                                        </Grid>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>Global Threshold: {threshold}</Typography>
                    <Slider min={1} max={30} value={threshold} onChange={handleThresholdChange} valueLabelDisplay="auto" />
                </Box>
            </Paper>
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Edit Keyword</DialogTitle>
                <DialogContent>
                    <TextField label="Keyword" value={editData.word} onChange={e => setEditData({ ...editData, word: e.target.value })} fullWidth margin="dense" />
                    <TextField label="Threshold" type="number" value={editData.threshold} onChange={e => setEditData({ ...editData, threshold: e.target.value })} fullWidth margin="dense" />
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography gutterBottom>Volume: {editData.volume}</Typography>
                        <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={Number(editData.volume)}
                            onChange={(_, value) => setEditData({ ...editData, volume: value })}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    <Input type="file" onChange={e => setEditData({ ...editData, sound: e.target.files[0] })} fullWidth margin="dense" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditDialogSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ConfigApp;

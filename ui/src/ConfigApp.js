import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, TextField, Button, List, ListItem, ListItemText, IconButton, Slider, Input, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tabs, Tab } from '@mui/material';
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
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [moduleConfig, setModuleConfig] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/config`).then(res => res.json()).then(cfg => {
            setKeywords(cfg.keywords || []);
            setThreshold(cfg.globalThreshold || 3);
        });
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/modules`)
            .then(res => res.json())
            .then(data => {
                setModules(data.modules);
                if (data.modules.length > 0) setSelectedModule(data.modules[0]);
            });
    }, []);

    useEffect(() => {
        if (selectedModule) {
            fetch(`${API_URL}/modules/${selectedModule}/config`)
                .then(res => res.json())
                .then(cfg => setModuleConfig(cfg));
        }
    }, [selectedModule]);

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

    const handleConfigChange = (key, value) => {
        setModuleConfig({ ...moduleConfig, [key]: value });
    };

    const handleSave = () => {
        fetch(`${API_URL}/modules/${selectedModule}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moduleConfig)
        }).then(res => res.json()).then(cfg => setModuleConfig(cfg));
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Module Configurations</Typography>
                <Tabs value={selectedModule} onChange={(_, v) => setSelectedModule(v)}>
                    {modules.map(m => <Tab key={m} label={m} value={m} />)}
                </Tabs>
                {moduleConfig && (
                    <Box sx={{ mt: 2 }}>
                        {Object.entries(moduleConfig).map(([key, value]) => {
                            // Handle array of objects (like keywords)
                            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                                return (
                                    <Box key={key} sx={{ mb: 3 }}>
                                        <Typography variant="h6">{key}</Typography>
                                        <List>
                                            {value.map((item, idx) => (
                                                <ListItem
                                                    key={idx}
                                                    secondaryAction={
                                                        <IconButton edge="end" onClick={() => {
                                                            // Remove item
                                                            const updated = [...value];
                                                            updated.splice(idx, 1);
                                                            setModuleConfig({ ...moduleConfig, [key]: updated });
                                                        }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                    />
                                                    <IconButton edge="end" onClick={() => {
                                                        // Optionally: open a dialog to edit this item
                                                        // For brevity, you can inline-edit here or use a dialog like your keywords
                                                    }}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                        {/* Add new item form */}
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                // Add a blank item (customize fields as needed)
                                                const updated = [...value, {}];
                                                setModuleConfig({ ...moduleConfig, [key]: updated });
                                            }}
                                        >
                                            Add {key.slice(0, -1)}
                                        </Button>
                                    </Box>
                                );
                            }
                            // Handle primitive values or arrays
                            return (
                                <TextField
                                    key={key}
                                    label={key}
                                    value={typeof value === 'object' ? JSON.stringify(value) : value}
                                    onChange={e => {
                                        let val = e.target.value;
                                        // Try to parse numbers/booleans
                                        if (!isNaN(val)) val = Number(val);
                                        setModuleConfig({ ...moduleConfig, [key]: val });
                                    }}
                                    fullWidth
                                    margin="dense"
                                />
                            );
                        })}
                        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>Save</Button>
                    </Box>
                )}
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

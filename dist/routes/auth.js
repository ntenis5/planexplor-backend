import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';
const authRouter = Router();
authRouter.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided.' });
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Invalid token.' });
        }
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError) {
            console.error('Error fetching profile:', profileError.message);
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                ...profile
            }
        });
    }
    catch (error) {
        console.error('Auth error (GET profile):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
authRouter.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { username, full_name, avatar_url } = req.body;
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided.' });
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        const updatePayload = {
            updated_at: new Date().toISOString()
        };
        if (username !== undefined)
            updatePayload.username = username;
        if (full_name !== undefined)
            updatePayload.full_name = full_name;
        if (avatar_url !== undefined)
            updatePayload.avatar_url = avatar_url;
        const { data: profile, error: updateError } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id)
            .select()
            .single();
        if (updateError) {
            console.error('Profile update error Supabase:', updateError.message);
            return res.status(400).json({ error: 'Failed to update profile.' });
        }
        res.json({ profile });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default authRouter;

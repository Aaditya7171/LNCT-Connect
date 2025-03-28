// ... existing code ...

// Update the multer configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
// Modify the multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

// Configure multer upload with smaller file size limit
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB limit to reduce timeout issues
    },
    fileFilter: fileFilter
});

// Update the route handler to be more robust
router.put('/:id', auth, (req, res) => {
    // Use multer as middleware with error handling
    upload.single('avatar')(req, res, async function(err) {
        if (err) {
            console.error('Multer error in route handler:', err);
            return res.status(400).json({ 
                msg: 'File upload error', 
                error: err.message 
            });
        }
        
        try {
            const userId = req.params.id;

            // Check if user exists
            let user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            // Check if user is authorized to update this profile
            if (req.user.id != userId) {
                return res.status(401).json({ msg: 'Not authorized to update this profile' });
            }

            // Prepare update data
            const updateData = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                college: req.body.college || user.college,
                branch: req.body.branch || user.branch,
                batch: req.body.batch || user.batch,
                linkedin_url: req.body.linkedin_url || user.linkedin_url
            };

            // Handle profile picture if uploaded
            if (req.file) {
                console.log('Profile picture uploaded:', req.file.filename);
                
                // Delete old profile picture if exists
                if (user.profile_picture) {
                    const oldPicturePath = path.join(__dirname, '../..', user.profile_picture);
                    if (fs.existsSync(oldPicturePath)) {
                        fs.unlinkSync(oldPicturePath);
                    }
                }

                // Set new profile picture path
                updateData.profile_picture = `/uploads/profile/${req.file.filename}`;
            }

            // Update user in database
            await user.update(updateData);

            // Fetch updated user
            user = await User.findByPk(userId);

            res.json({ data: user });
        } catch (err) {
            console.error('Error updating user profile:', err);
            res.status(500).json({ msg: 'Server error', error: err.message });
        }
    });
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};
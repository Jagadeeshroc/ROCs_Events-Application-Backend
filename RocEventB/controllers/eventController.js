const Event = require('../models/Event');

// 1. Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity, images } = req.body;
    const newEvent = new Event({
      title, description, date, location, capacity, images,
      organizer: req.user.id
    });
    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. Get All Events (HIGHLY OPTIMIZED)
exports.getEvents = async (req, res) => {
  try {
    // We use .find() with projection to only fetch data needed for the Event Card
    const events = await Event.find({}, {
      title: 1,
      date: 1,
      location: 1,
      capacity: 1,
      organizer: 1,
      // MongoDB Slice: Only fetch the first image for the thumbnail
      images: { $slice: 1 }, 
      // Optimization: Fetch the attendees array so we can count it in memory 
      // (For very large apps, use aggregation to count at DB level)
      attendees: 1 
    })
    .populate('organizer', 'name profileImage') // Fetch minimal organizer details
    .lean(); // MAGIC: Converts to plain JSON, skipping Mongoose overhead (Faster)

    // Post-processing: Replace heavy attendee array with a simple count
    const response = events.map(event => ({
      ...event,
      attendeesCount: event.attendees ? event.attendees.length : 0,
      attendees: event.attendees ? event.attendees : [] // Remove the heavy array from the response
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. Get Single Event by ID (Detailed View)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email profileImage')
      // Only populate essential attendee info
      .populate('attendees', 'name email mobile profileImage') 
      .lean(); // Use lean here too for speed

    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. RSVP to Event (Atomic & Safe)
exports.rsvpEvent = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    // Check duplication
    const eventCheck = await Event.findById(eventId).select('attendees');
    // Ensure attendees exists before checking
    if (eventCheck && eventCheck.attendees.includes(userId)) {
      return res.status(400).json({ message: "You have already joined this event" });
    }

    // Atomic Update
    const event = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        $expr: { $lt: [{ $size: "$attendees" }, "$capacity"] } 
      },
      { $push: { attendees: userId } },
      { new: true }
    );

    if (!event) {
      return res.status(400).json({ message: "Event is full or does not exist" });
    }

    res.json({ message: "RSVP Successful", eventId: event._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// 5. Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { search } = req.query;

    // 1. Build the Search Query
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },    // Search Title (Case-insensitive)
          { location: { $regex: search, $options: 'i' } }  // Search Location
        ]
      };
    }

    // 2. Run Query
    const events = await Event.find(query, {
      title: 1, date: 1, location: 1, capacity: 1, organizer: 1,
      images: { $slice: 1 }, 
      attendees: 1 
    })
    .populate('organizer', 'name profileImage')
    .populate('attendees', '_id') 
    
    .lean();

    // 3. Format Response (same as before)
    const response = events.map(event => ({
      ...event,
      attendeesCount: event.attendees ? event.attendees.length : 0,
      attendees: event.attendees ? event.attendees : [] 
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
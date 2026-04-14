import PlacedStudent from "../models/placedStudentModel.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

export const addPlacedStudent = async (req, res) => {
  try {
    const { name, title, company, city, order } = req.body;

    if (!name?.trim() || !title?.trim() || !company?.trim() || !city?.trim()) {
      return res
        .status(400)
        .json({ message: "Name, title, company, and city are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo upload is required." });
    }

    // Handle position conflicts
    let finalOrder = Number(order) || 0;
    if (finalOrder > 0) {
      const existingStudent = await PlacedStudent.findOne({ order: finalOrder });
      if (existingStudent) {
        // Auto-increment positions for existing students
        await PlacedStudent.updateMany(
          { order: { $gte: finalOrder } },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // If no order specified, put at the end
      const maxOrder = await PlacedStudent.findOne().sort({ order: -1 });
      finalOrder = maxOrder ? maxOrder.order + 1 : 1;
    }

    const [uploadResult] = await cloudinaryUpload([req.file]);
    const photoUrl = uploadResult.secure_url;

    const student = await PlacedStudent.create({
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      city: city.trim(),
      photo: photoUrl,
      order: finalOrder,
    });

    return res.status(201).json({ message: "Student added", student });
  } catch (error) {
    console.error("addPlacedStudent error:", error);
    return res
      .status(500)
      .json({ message: "Failed to add student", error: error.message });
  }
};

export const getPlacedStudents = async (_req, res) => {
  try {
    const students = await PlacedStudent.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ students });
  } catch (error) {
    console.error("getPlacedStudents error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch students", error: error.message });
  }
};

export const updatePlacedStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, company, city, order } = req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (title) update.title = title.trim();
    if (company) update.company = company.trim();
    if (city) update.city = city.trim();
    
    // Handle order updates with conflict resolution
    if (order !== undefined) {
      const newOrder = Number(order);
      const currentStudent = await PlacedStudent.findById(id);
      
      if (currentStudent && currentStudent.order !== newOrder) {
        if (newOrder > 0) {
          // Check for conflicts
          const conflictStudent = await PlacedStudent.findOne({ 
            order: newOrder, 
            _id: { $ne: id } 
          });
          
          if (conflictStudent) {
            // Handle position conflict - shift other students
            if (newOrder > currentStudent.order) {
              // Moving down - shift up students in between
              await PlacedStudent.updateMany(
                { 
                  order: { $gt: currentStudent.order, $lte: newOrder },
                  _id: { $ne: id }
                },
                { $inc: { order: -1 } }
              );
            } else {
              // Moving up - shift down students in between
              await PlacedStudent.updateMany(
                { 
                  order: { $gte: newOrder, $lt: currentStudent.order },
                  _id: { $ne: id }
                },
                { $inc: { order: 1 } }
              );
            }
          }
        }
        update.order = newOrder;
      }
    }
    if (req.file) {
      const [uploadResult] = await cloudinaryUpload([req.file]);
      update.photo = uploadResult.secure_url;
    }

    const student = await PlacedStudent.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ message: "Student updated", student });
  } catch (error) {
    console.error("updatePlacedStudent error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update student", error: error.message });
  }
};

export const deletePlacedStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await PlacedStudent.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json({ message: "Student deleted" });
  } catch (error) {
    console.error("deletePlacedStudent error:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete student", error: error.message });
  }
};

// Bulk reorder for drag-and-drop functionality
export const reorderPlacedStudents = async (req, res) => {
  try {
    const { studentIds } = req.body; // Array of student IDs in new order

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Student IDs array is required" });
    }

    // Update each student's order based on their position in the array
    const updatePromises = studentIds.map((id, index) => 
      PlacedStudent.findByIdAndUpdate(id, { order: index + 1 }, { new: true })
    );

    const updatedStudents = await Promise.all(updatePromises);
    
    // Filter out any null results (students not found)
    const validStudents = updatedStudents.filter(student => student !== null);

    return res.status(200).json({ 
      message: "Students reordered successfully", 
      students: validStudents 
    });
  } catch (error) {
    console.error("reorderPlacedStudents error:", error);
    return res
      .status(500)
      .json({ message: "Failed to reorder students", error: error.message });
  }
};

import studentModel from "../models/studentModel.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";
import { sendAckEmail, sendDataByEmail } from "../services/acknowledgement.js";
import Test from "../models/testModel.js";
import attemptQuiz from "../models/QuizAttempt.js";
import careerApplicationModel from "../models/careerApplicationModel.js";
import mongoose from "mongoose";
import { generatePassword } from "../services/passwordGenerator.js";



export async function register(req, res) {
  try {

    let aadharFront = "", aadharBack = "";
    const toBool = (value) => value === true || value === "true";

    const {
      name,
      email: rawEmail,
      phone,
      dob,
      gender,
      fname,
      fphone,
      laddress,
      paddress,
      qualification,
      qualificationYear,
      college,
      designation,
      company,
      course,
      otherCourse,
      referral,
      friendName,
      termsAccepted,
      aadharFront: aadharFrontBody,
      aadharBack: aadharBackBody,
      fatherName,
      fatherPhone,
      localAddress,
      permanentAddress,
      qualYear,
      tcAccepted,
    } = req.body;

    const files = Array.isArray(req.files) ? req.files : [];
    const aadharFiles = files.filter(
      (file) => file.fieldname === "aadharFront" || file.fieldname === "aadharBack"
    );

    if (aadharFiles.length > 0) {
      const cloudinaryObject = await cloudinaryUpload(aadharFiles);

      cloudinaryObject.forEach((uploaded) => {
        if (uploaded.fieldname === "aadharFront") {
          aadharFront = uploaded.secure_url;
        } else if (uploaded.fieldname === "aadharBack") {
          aadharBack = uploaded.secure_url;
        }
      });
    } else {
      aadharFront = aadharFrontBody || "";
      aadharBack = aadharBackBody || "";
    }

    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const plainPassword = generatePassword();

    const newRegistration = new studentModel({
      name,
      email,
      phone,
      dob,
      gender,
      fname: fname || fatherName,
      fphone: fphone || fatherPhone,
      laddress: laddress || localAddress,
      paddress: paddress || permanentAddress,
      role: "student",
      qualification,
      qualificationYear: qualificationYear || qualYear,
      college,
      designation,
      company,
      course,
      otherCourse,
      referral,
      friendName,
      aadharFront,
      aadharBack,
      password: plainPassword,
      firstTimesignin: true,
      termsAccepted: toBool(termsAccepted) || toBool(tcAccepted) || false,
    });

    await newRegistration.save();

    sendAckEmail({ ...newRegistration.toObject(), plainPassword });
    sendDataByEmail(newRegistration);

    return res.status(201).send({ message: "Registration Successful" });
    
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).send({
      message: "Error registering student",
      error: error.message,
    });
  }
}

export async function createCareerApplication(req, res) {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const position = typeof req.body.position === "string" ? req.body.position.trim() : "";
    const resumeFile = req.file;

    if (!name || !email || !position) {
      return res.status(400).json({ message: "Name, email, and position are required." });
    }

    if (!resumeFile) {
      return res.status(400).json({ message: "Resume PDF is required." });
    }

    const isPdf =
      resumeFile.mimetype === "application/pdf" ||
      resumeFile.originalname?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return res.status(400).json({ message: "Only PDF resumes are allowed." });
    }

    const [resumeUpload] = await cloudinaryUpload([
      {
        ...resumeFile,
        fieldname: "resume",
      },
    ]);

    if (!resumeUpload?.secure_url) {
      return res.status(500).json({ message: "Failed to upload resume." });
    }

    const application = await careerApplicationModel.create({
      name,
      email,
      position,
      resumeUrl: resumeUpload.secure_url,
      resumeOriginalName: resumeFile.originalname,
      resumeMimeType: resumeFile.mimetype,
      resumeSize: resumeFile.size,
    });

    return res.status(201).json({
      message: "Career application submitted successfully.",
      applicationId: application._id,
    });
  } catch (error) {
    console.error("Career application error:", error);
    return res.status(500).json({
      message: "Failed to submit career application.",
      error: error.message,
    });
  }
}

export async function fetchStudent(req, res) {
  try {
    const students = await studentModel
      .find()
      .select('-email_check -password -salt') 
      .sort({ createdAt: -1 });

    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students: ", error);
    return res.status(500).json({
      message: "Failed to fetch student data",
      error: error.message,
    });
  }
}

export async function fetchStudentById(req, res) {
  try {
    const { id } = req.params;

    const student = await studentModel.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    res.status(500).json({ message: "Server error while fetching student." });
  }
}

export async function checkEmailExists(req, res) {
  try {
    const rawEmail = typeof req.query.email === "string" ? req.query.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const exists = await studentModel.exists({ email });
    return res.status(200).json({ exists: Boolean(exists) });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({
      message: "Failed to check email",
      error: error.message,
    });
  }
}

export async function updateStudentDetails(req, res) {
  try {
    const { id } = req.params;
    const { fees, startDate, remarks } = req.body;

    const updatedStudent = await studentModel.findByIdAndUpdate(
      id,
      { fees, startDate, remarks },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student updated", student: updatedStudent });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export async function getQuestion(req, res) {
  const { testId } = req.params;

  try {
    const test = await Test.findById(testId).populate("questions");
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res
      .status(200)
      .json({ questions: test.questions, duration: test.duration });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving questions", error: error.message });
  }
};

export async function startQuiz(req, res) {
  try {
    const token = req.firstTimeSignin;
    const { testId } = req.params;

    const user = await studentModel.findById(token.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const studentId = token.id;
    const newAttempt = {
      testId,
      startTime: new Date(),
      responses: [] // Initialize empty responses array for this attempt
    };

    let quizAttemptDoc = await attemptQuiz.findOne({ studentId });

    if (quizAttemptDoc) {
      const alreadyAttempted = quizAttemptDoc.attempts.some(
        (attempt) => attempt.testId.toString() === testId
      );
      if (alreadyAttempted) {
        return res.status(400).json({ message: "You have already attempted this quiz." });
      }

      quizAttemptDoc.attempts.push(newAttempt);
      await quizAttemptDoc.save();

      const latestAttemptId = quizAttemptDoc.attempts[quizAttemptDoc.attempts.length - 1]._id;

      return res.status(201).json({
        message: "Quiz attempt started",
        quizAttemptId: latestAttemptId,
      });
    } else {
      const newQuizAttemptDoc = new attemptQuiz({
        studentId,
        studentName: user.name,
        attempts: [newAttempt],
      });

      await newQuizAttemptDoc.save();

      return res.status(201).json({
        message: "Quiz attempt started",
        quizAttemptId: newQuizAttemptDoc.attempts[0]._id,
      });
    }
  } catch (error) {
    console.error("Error starting quiz:", error);
    res.status(500).json({ message: "Error starting quiz", error: error.message });
  }
}


export async function submitAnswer(req, res) {
  try {
    const { quizAttemptId, testId } = req.params;
    const { questionId, selectedOption, selectedAnswer } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const question = test.questions.find(q =>
      q._id.toString() === questionId.toString()
    );

    if (!question) return res.status(404).json({ message: "Question not found" });

    const correctAnswer = question.correct_answer;
    

    const quizAttemptDoc = await attemptQuiz.findOne({
      "attempts._id": quizAttemptId,
    });

    if (!quizAttemptDoc)
      return res.status(404).json({ message: "Quiz attempt not found" });

    const attempt = quizAttemptDoc.attempts.id(quizAttemptId);
    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });

    const existingResponseIndex = attempt.responses.findIndex(
      (resp) => resp.questionId.toString() === questionId.toString()
    );

    if (existingResponseIndex !== -1) {
      attempt.responses[existingResponseIndex].selectedOption = selectedOption;
      attempt.responses[existingResponseIndex].selectedAnswer = selectedAnswer;
      attempt.responses[existingResponseIndex].correct_answer = correctAnswer;
    } else {
      attempt.responses.push({
        questionId,
        selectedOption,
        selectedAnswer,
        correct_answer: correctAnswer,
      });
    }

    await quizAttemptDoc.save();

    return res.status(200).json({ message: "Answer submitted successfully" });

  } catch (error) {
    console.error("Submit answer error:", error);
    return res.status(500).json({
      message: "Error submitting answer",
      error: error.message,
    });
  }
}

export async function finishQuiz(req, res) {
  try {
    const { quizAttemptId } = req.params;
    const { score, reason } = req.body; 

    if (typeof score !== "number") {
      return res.status(400).json({ message: "Score must be a number" });
    }

    const quizAttemptDoc = await attemptQuiz.findOne({
      "attempts._id": quizAttemptId,
    });

    if (!quizAttemptDoc) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    const attempt = quizAttemptDoc.attempts.id(quizAttemptId);

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.endTime) {
      return res.status(400).json({ message: "Quiz already completed" });
    }

    attempt.endTime = new Date();
    attempt.score = score;
    attempt.finishReason = reason || "Manual submission"; 

    await quizAttemptDoc.save();

    return res.status(200).json({ message: "Quiz completed", attempt });
  } catch (error) {
    console.error("Error finishing quiz:", error);
    return res.status(500).json({ message: "Error finishing quiz", error: error.message });
  }
}



export async function deleteManyStudents(req, res) {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "No student IDs provided for deletion." });
  }

  try {
    const result = await studentModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: `${result.deletedCount} student(s) deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting students:", err);
    return res.status(500).json({ message: "Failed to delete students", error: err.message });
  }
}


export async function getAllScore(req, res) {
  try {
    const students = await attemptQuiz.find()
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students: ", error);
    return res.status(500).json({
      message: "Failed to fetch student data",
      error: error.message,
    });
  }
}
export async function getScoresByTest(req, res) {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid Test ID format!" });
    }

    // Fixed aggregation pipeline
    const students = await attemptQuiz.aggregate([
      {
        $match: {
          "attempts.testId": new mongoose.Types.ObjectId(testId)
        }
      },
      {
        $unwind: "$attempts"
      },
      {
        $match: {
          "attempts.testId": new mongoose.Types.ObjectId(testId)
        }
      },
      {
        $project: {
          _id: 0,
          studentId: "$studentId",
          studentName: "$studentName",
          collegeId: "$collegeId",
          score: "$attempts.score",
          startTime: "$attempts.startTime",
          endTime: "$attempts.endTime",
          testId: "$attempts.testId"
        }
      },
      {
        $sort: { score: -1 } 
      }
    ]);
    
    
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found for this test!" });
    }
    
    
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching test scores:", error);
    return res.status(500).json({
      message: "Failed to fetch scores for the test",
      error: error.message,
    });
  }
}


export const StudenAnswer = async (req, res) => {
  const { studentId, testId } = req.params;

  try {
    const attemptDoc = await attemptQuiz.findOne({ studentId });

    if (!attemptDoc) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    const matchingAttempt = attemptDoc.attempts.find(
      (a) => a.testId.toString() === testId
    );

    if (!matchingAttempt) {
      return res.status(404).json({ message: "Test attempt not found" });
    }
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const questionMap = {};
    test.questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const responseDetails = matchingAttempt.responses.map((r) => {
      const question = questionMap[r.questionId.toString()];
      return {
        questionText: question?.question?.text || "",
        questionImage: question?.question?.fileUrl || null,
        options: question?.options || [],
        correctAnswer: question?.correct_answer || "",
        selectedOption: r.selectedOption || "",
        selectedAnswer: r.selectedAnswer || "", 
      };
    });

    res.status(200).json({
      studentName: attemptDoc.studentName,
      studentId: attemptDoc.studentId,
      score: matchingAttempt.score,
      startTime: matchingAttempt.startTime,
      endTime: matchingAttempt.endTime,
      responses: responseDetails,
    });
  } catch (error) {
    console.error("Error fetching score details:", error);
    res.status(500).json({ message: "Failed to fetch score details", error: error.message });
  }
};


// Add this new function to your student controller

export async function getStudentQuizAttempts(req, res) {
  try {
    const token = req.firstTimeSignin; 
    const studentId = token.id;


    const studentAttempts = await attemptQuiz.findOne({ studentId });
    
    if (!studentAttempts || !studentAttempts.attempts.length) {
      return res.status(200).json([]); 
    }
    const testIds = studentAttempts.attempts.map(attempt => attempt.testId);

    const tests = await Test.find({ 
      _id: { $in: testIds },
      result: true // Only get tests where results have been released
    });  

    // Create a map of test IDs for quick lookup
    const releasedTestIds = new Set(tests.map(test => test._id.toString()));

    // Filter attempts to only include those with released results
    const releasedAttempts = studentAttempts.attempts.filter(attempt => 
      releasedTestIds.has(attempt.testId.toString())
    );

    // Format the response data
    const formattedAttempts = releasedAttempts.map(attempt => {
      const test = tests.find(t => t._id.toString() === attempt.testId.toString());
      return {
        _id: attempt._id,
        testId: attempt.testId,
        testTitle: test?.title || 'Unknown Test',
        testDuration: test?.duration || 0,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        score: attempt.score,
        responses: attempt.responses,
        studentName: studentAttempts.studentName,
        studentId: studentAttempts.studentId
      };
    });

    // Sort by most recent first
    formattedAttempts.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return res.status(200).json(formattedAttempts);

  } catch (error) {
    console.error("Error fetching student quiz attempts:", error);
    return res.status(500).json({
      message: "Failed to fetch quiz attempts",
      error: error.message,
    });
  }
}

// Also add this function to get detailed results for a specific attempt
export async function getStudentQuizAttemptDetail(req, res) {
  try {
    const token = req.firstTimeSignin;
    const studentId = token.id;
    const { quizAttemptId } = req.params;

    const studentAttempts = await attemptQuiz.findOne({ studentId });

    if (!studentAttempts) {
      return res.status(404).json({ message: "No quiz attempts found" });
    }

    const attempt = studentAttempts.attempts.id(quizAttemptId);

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    const test = await Test.findById(attempt.testId);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (test.result===false) {
      return res.status(403).json({ message: "Results not yet released for this test" });
    }

    // Create question map for detailed responses
    const questionMap = {};
    test.questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const responseDetails = attempt.responses.map((r) => {
      const question = questionMap[r.questionId.toString()];
      return {
        questionText: question?.question?.text || "",
        questionImage: question?.question?.fileUrl || null,
        options: question?.options || [],
        correctAnswer: question?.correct_answer || "",
        selectedOption: r.selectedOption || "",
        selectedAnswer: r.selectedAnswer || "",
        isCorrect: r.selectedAnswer === question?.correct_answer
      };
    });

    return res.status(200).json({
      studentName: studentAttempts.studentName,
      studentId: studentAttempts.studentId,
      testTitle: test.title,
      testDuration: test.duration,
      score: attempt.score,
      totalQuestions: attempt.responses.length,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      responses: responseDetails,
    });

  } catch (error) {
    console.error("Error fetching quiz attempt details:", error);
    return res.status(500).json({
      message: "Failed to fetch quiz attempt details",
      error: error.message,
    });
  }
}

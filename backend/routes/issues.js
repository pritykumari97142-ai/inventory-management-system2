const express = require("express");

const { getIssues, addIssue } = require("../controllers/issueController");

const router = express.Router();

router.get("/", getIssues);

router.post("/", addIssue);

module.exports = router;

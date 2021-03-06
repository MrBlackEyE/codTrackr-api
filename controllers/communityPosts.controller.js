// NPM Libraries
let PatrolMan = require('patrolman');

// Config
const APIURL = require('../config/config.environment')[process.env.NODE_ENV].url;

// Utils
const Emailer = require('../utils/emailer');
const { isNllOrUnd } = require('../utils/validator');
const Logger = require('../utils/winston');
const MazzError = require('../utils/mazzErrors');

// Datatypes
const { newCommunityPost } = require('../datatypes/emails.datatypes');

// Helpers
const CommunityPostsHelper = require('../mongo/helpers/communityPosts.helper');

// Policies
const PatrolManPolicies = require('../policies/config');

// Constants
PatrolMan = new PatrolMan(PatrolManPolicies);

const CommunityPostsController = {
  createPost: async (req, res) => {
    const {
      author,
      content,
      title,
    } = req.body;

    const createPost = await CommunityPostsHelper.createNewPost({
      author,
      content,
      title,
      epochTime: new Date().getTime(),
    });

    newCommunityPost.text = `
Author: ${author}
Title: ${title}
Content: 
${content}

Approval URL: ${APIURL}/api/communityPosts/post/${createPost._id}/approve
    `;

    Emailer.postEmail(newCommunityPost);

    return res.status(200).json({ success: true, res: createPost });
  },
  getPosts: async (req, res) => {
    let posts = await CommunityPostsHelper.findAllPosts({ approved: true }, undefined, { sort: { _id: -1 } });

    if (isNllOrUnd(posts)) {
      posts = [];
    }

    return res.status(200).json({ success: true, posts });
  },
  approvePost: async (req, res) => {
    try {
      const {
        postId,
      } = req.params;

      const approveRes = await CommunityPostsHelper.approvePostByPostId(
        {
          _id: postId,
        },
        {
          approved: true,
        },
      );

      return res.status(200).json({ success: true, created: approveRes });
    } catch (error) {
      Logger.error('Unable to approve post: ', error);
      return res.status(500).json(new MazzError().addServerError(error.message));
    }
  },
};

module.exports = PatrolMan.patrol('communityPosts', CommunityPostsController);

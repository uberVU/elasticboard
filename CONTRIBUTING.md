Elasticboard Contributing Guidelines
======

Planning
--------

Everything you do must start out with a plan, covering how and what you’ll accomplish - describe this in a Github issue, even if you will be the person implementing this.

If you need some help with how to organize your Github issue, check out the template provided by
[_recommended template_](https://github.com/uberVU/playbook/blob/master/github/issue_template.md).

_Caveat - don’t over-describe your issue, if you need to document how classes work, it would be better to write this down in a README.md documentation, or docstrings. Keep it short & simple._

At the end of the planning phase, you should ask someone to review your issue. This is needed to ensure that you’re not about to spend 2 days working on something that is already taken care of in another issue, deprecated, etc.

Implementation
--------------

**Code review**: After you’re done with the coding part, ask for another review, preferably from the same person that reviewed your plan. The reviewer should give you a LGTM.

Q & A
-----

**Q: Is the plan review really necessary?**

**A:** The plan review is _highly recommended_, but you may skip it if you want. However, if you want to skip the plan review, please make sure that:

 * you’re confident your plan is good
 * the implementation of this plan will be short (<1 day)

_Warning_ - if you skip the plan review, the code reviewer might ask that you change your design after you've done all the work already.

**Q: What if I don’t agree with my reviewer?**

**A:** If you and your plan/code reviewer don’t see things eye to eye, ask a third person to help out with the decision(s) - please bring in someone with experience.

**Q: Who should I ask to review my code/plan?**

**A:** We _recommend_ that at least one of your reviewers is one of the core comitters to the project.

**Q: Can I jump-in on pull requests I'm not involved in?**

**A:** Yes, we encourage communication and collaboration.


Submitting code
-----

Reviewers have a tough life, so make sure you’re doing everything you can to make their job easier. Before you ask for a code review, please spend a few minutes to **read your own code review** (on Github), and ensure your code:

 1. respects the [style-guide](http://google-styleguide.googlecode.com/svn/trunk/pyguide.html) (spaces, tabs, etc. - use Pylint)
 2. is well commented (class comments, method comments and/or inline comments)
 3. has tests!
 4. added lines of code for review should be under 200, and never exceed 400 (hard limit)!
 5. run existing tests for the code that you changed (or all tests)!

**Tip** - reading your own code review significantly reduces the number of defects that your reviewer will find!

When submitting a second or third diff for the same change, your reviewer assumes that for every comment he or she wrote you either:

 * implemented the change or
 * replied to it.

Please don’t expect the reviewer to go through the list of previous comments and validate that you’ve addressed each one. That’s your job.

To ask for code review, either CC someone in the GitHub interface, or use a PM to point him/her to your pull request.


Reviewing code
-----

Always review code for **45-60 minutes or less** – never review for more than an hour at a time -  reviewer effectiveness drops precipitously after one hour.

Please keep discussions on GitHub short! Remember, GitHub is not mIRC: if you feel the conversation is getting too long, switch to another channel (live, Skype, etc.).

Use a "LGTM" comment to let the commiter know you're satisfied with the result, and that he can merge at will. If you're not satisfied, comment what you want the commiter to change, but **do not give a LGTM**.

How exactly to do a code review is beyond the scope of this document, but
here's a quick list of what to watch out for:

 * Correctness of code (finding bugs & general incorrectness)
 * Maintainability & Extensibility – are we able to easily extend the solution, fix bugs? (this includes many fundamental programming rules, e.g. DRY, OO design, DB design etc.)
 * Testability - are we able to test the code easily?
 * Documentation – are we able to understand why the code was made and what it does?
 * Improving code quality
 * Code consistency (ideally, you should not be able to tell the author from the code)
 * Teaching best practices & learning code (avoid the "bus factor")

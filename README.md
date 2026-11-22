# Client authorization for a lawyer to obtain records

An interview for clients whose Massachusetts lawyer requests the VLP general authorization. It names counsel, the dispute, and an optional witness, then produces a printable authorization with blank signature and date lines. The client and witness sign together after printing. The tool does not hire a lawyer or transmit the authorization.

Entry point: `docassemble.AttorneyAuthorizationforRelease:data/questions/Attorney_Authorization_for_Release.yml`.

The operative one-year authorization follows the English form currently linked at https://www.masslegalservices.org/content/client-authorization-release-information (VLP, June 13, 2013), downloaded and compared on November 22, 2026. The form authorizes the named lawyer and designated legal staff to act as legal counsel and grants broad records access about the named dispute. The introduction makes this clear and tells users to ask counsel about narrower permission or records needing a special release. Users without a lawyer's request are directed to check with counsel first.

`LIST_topics` and `tags` use `CO-09-04-00-00` (establishing a lawyer-client relationship), verified against taxonomy.legal's live feed. No deeper child fits: this form sets authorization, not a fee/retainer agreement or conflicts check. Medical privacy and substantive case topics would misrepresent this general counsel authorization.

Three ALKiln scenarios cover a named witness and one opposing organization, an unnamed witness and multiple opposing parties, and the no-lawyer-request exit. The first two download and inspect PDF text. Local test artifacts are ignored.

Original student author: Kayla Gallagher, kgallagher6@su.suffolk.edu.

Run browser scenarios against a local installation with `python tests/run_alkiln.py .`. Set `ALKILN_PATH` if ALKiln is not at `~/ALKiln`. The runner reads local credentials without saving them in tracked files.

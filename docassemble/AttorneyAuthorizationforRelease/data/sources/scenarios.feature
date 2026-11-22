Feature: Client authorization requested by a lawyer

  Scenario: Client names a witness for a landlord dispute
    Given I start the interview at "Attorney_Authorization_for_Release.yml"
    And I wait 1 second
    And the maximum seconds for each step is 90
    When I get to "authorization download" with this data:
      | var | value | trigger |
      | acknowledged_information_use | True | |
      | lawyer_requested_form | True | |
      | users[0].name.first | Maya | |
      | users[0].name.last | Rivera | |
      | lawyer.name.first | Alex Counsel | |
      | attorneys_address | 10 Sample Street, Suite 2 | |
      | attorneys_city | Boston | |
      | dispute_with | Example Properties LLC | |
      | witness_name | Devon Chen | |
    Then I download "client_authorization_for_lawyer.pdf"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should contain "Example Properties LLC"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should contain "Devon Chen"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should contain "one year"
    When I follow the review link containing "Edit answers"
    And I follow the review link containing "Legal problem with:"
    And I get to "review authorization" with this data:
      | var | value | trigger |
      | dispute_with | Revised Company | |
    And I continue
    Then the question id should be "authorization download"
    When I download a fresh copy of "client_authorization_for_lawyer.pdf"
    Then the downloaded PDF "client_authorization_for_lawyer.pdf" should contain "Revised Company"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should not contain "Example Properties LLC"

  Scenario: Client leaves witness name for signing later and names two parties
    Given I start the interview at "Attorney_Authorization_for_Release.yml"
    And I wait 1 second
    And I use a narrow phone viewport
    And the maximum seconds for each step is 90
    When I get to "authorization download" with this data:
      | var | value | trigger |
      | acknowledged_information_use | True | |
      | lawyer_requested_form | True | |
      | users[0].name.first | Devon | |
      | users[0].name.last | Chen | |
      | lawyer.name.first | Sample Legal Services | |
      | attorneys_address | 20 Example Road | |
      | attorneys_city | Worcester | |
      | dispute_with | Example Company and Alex Example | |
      | witness_name |  | |
    Then I download "client_authorization_for_lawyer.pdf"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should contain "Example Company and Alex Example"
    And the downloaded PDF "client_authorization_for_lawyer.pdf" should not contain "None"
    And the interview fits the phone width
    And I take a screenshot named "authorization-phone"

  Scenario: Person has not been asked by a lawyer to sign a release
    Given I start the interview at "Attorney_Authorization_for_Release.yml"
    And I wait 1 second
    When I get to "talk with lawyer" with this data:
      | var | value | trigger |
      | acknowledged_information_use | True | |
      | lawyer_requested_form | False | |
    Then I should see the phrase "Check with your lawyer first"

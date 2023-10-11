
describe('Game is Working Fine', ()=>{
    it('should display the start button on initial page load', () => {
        cy.visit('/');
        cy.get('#startQuiz').should('be.visible');
    });
    it('should navigate to quiz screen on starting the quiz', () => {
        cy.visit('/');
        cy.get('#startQuiz').click();
        cy.get('#startScreen').should('have.class', 'hidden');
        cy.get('#quizScreen').should('not.have.class', 'hidden');
        cy.get('#question').should('be.visible');
        cy.get('.answer').should('have.length', 4);
    });
    it('should start the timer on quiz start', () => {
        cy.visit('/');
        cy.get('#startQuiz').click();
        cy.get('#timer').should('contain', 'Time left: 60 seconds');
        cy.wait(3000);
        cy.get('#timer').should('not.contain', 'Time left: 59 seconds');
    });
    it('should fetch a new question after answering the previous one', function() {
        cy.visit('/');

        cy.get('#startQuiz').click();

        // Store the initial question
        cy.get('#question').invoke('text').then((initialQuestion) => {

            // Answer the first question (regardless of correctness)
            cy.get('.answer').first().click();

            // After answering, check that the new question is not the same as the initial one
            cy.get('#question').should(($newQuestion) => {
                expect($newQuestion.text()).not.to.eq(initialQuestion);
            });
        });
    });
    it('should return the correct response format', function() {
        cy.request('https://opentdb.com/api.php?amount=1').then((response) => {
            expect(response.status).to.eq(200); // Assert status code

            // Validate response body structure
            expect(response.body).to.have.property('response_code');
            expect(response.body).to.have.property('results').and.be.a('array');
            expect(response.body.results[0]).to.have.property('category').and.be.a('string');
            expect(response.body.results[0]).to.have.property('type').and.be.a('string');
            expect(response.body.results[0]).to.have.property('difficulty').and.be.a('string');
            expect(response.body.results[0]).to.have.property('question').and.be.a('string');
            expect(response.body.results[0]).to.have.property('correct_answer').and.be.a('string');
            expect(response.body.results[0]).to.have.property('incorrect_answers').and.be.a('array');
        });
    });
    it('should increase the score by 10 when the response is correct', function() {
        cy.visit('/');
        cy.get('#startQuiz').click();

        // Initially, the score should be 0.
        cy.get('#score').should('have.text', '0');

        // Mock the API response to ensure consistent behavior
        cy.intercept('https://opentdb.com/api.php?amount=1', {
            body: {
                response_code: 0,
                results: [{
                    category: "Test Category",
                    type: "multiple",
                    difficulty: "easy",
                    question: "Test Question",
                    correct_answer: "Correct Answer",
                    incorrect_answers: ["Wrong 1", "Wrong 2", "Wrong 3"]
                }]
            }
        });

        // Reloading to apply the mocked API response
        cy.reload();
        cy.get('#startQuiz').click();
        cy.contains('button', 'Correct Answer').click();
        cy.get('#score').should('have.text', '10');
    });
      
})

describe('End quizz', ()=>{
    beforeEach(()=>{
        cy.visit('/');
    })
    it('should end the game when the timer reaches zero', () => {
        cy.get('#startQuiz').click();
        cy.window().invoke('eval', 'timer = 0');
        
        cy.wait(2000);  // Short wait to give the app some time to process
        cy.get('#endScreen').should('not.have.class', 'hidden');
    });
    it('should restart the quiz on clicking "Play Again"', () => {
        cy.get('#startQuiz').click();
        cy.window().invoke('eval', 'timer = 0');
        
        cy.wait(2000);  // Short wait to give the app some time to process
        cy.get('#playAgain').click();
        cy.get('#quizScreen').should('not.have.class', 'hidden');
    });
    it('Displays the correct final score on end screen', () => {
        cy.intercept('GET', 'https://opentdb.com/api.php?amount=1', {
            // This is the mock response structure based on the API you've mentioned. 
            // Adjust it if the real API response is different.
            body: {
                "results": [{
                    "question": "Mocked Question?",
                    "correct_answer": "Correct Answer",
                    "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]
                }]
            }
        }).as('fetchQuestion');
        // Click on Start Quiz
        cy.get('#startQuiz').click();

        // Answer 3 questions correctly using the mock data
        for (let i = 0; i < 3; i++) {
            cy.wait('@fetchQuestion');  // Wait for the mock API response
            cy.get('.answer').contains('Correct Answer').click();
        }
        cy.window().invoke('eval', 'timer = 0');
        
        cy.wait(2000);

        // Check the end screen for the correct score
        cy.get('#finalScore').should('contain', 'Your score: 30'); // 3 questions * 10 marks each = 30
    });
})

describe('Handling API failure', ()=>{
    beforeEach(()=>{
        cy.visit('/');
    })
    it('should handle API failure gracefully', () => {
        cy.intercept('https://opentdb.com/api.php?amount=1', {statusCode: 500}).as('getQuestionFailure');
        cy.get('#startQuiz').click();
        cy.wait('@getQuestionFailure');
        cy.get('#quizScreen').should('not.have.class', 'hidden');
    });
    it('Handles missing data in API response', () => {
        cy.intercept('GET', 'https://opentdb.com/api.php?amount=1', {
            body: {
                "results": [{}]
            }
        }).as('fetchQuestionIncompleteData');
    
        cy.get('#startQuiz').click();
        cy.wait('@fetchQuestionIncompleteData');
    
        cy.get('#question').should('contain', 'Error fetching the question. Please try again.');
    });
    it('Handles unexpected data in API response', () => {
        cy.intercept('GET', 'https://opentdb.com/api.php?amount=1', {
            body: {
                "unexpectedField": "unexpectedValue"
            }
        }).as('fetchQuestionUnexpectedData');
    
        cy.get('#startQuiz').click();
        cy.wait('@fetchQuestionUnexpectedData');
    
        cy.get('#question').should('contain', 'Error fetching the question. Please try again.');
    });
})

describe('Quiz App Responsiveness', function() {

    beforeEach(() => {
        cy.visit('/');
    });

    it('should display correctly on desktop', function() {
        cy.viewport(1280, 720);
        
        // Check elements, their positions, or any other specifics for desktop layout here.
        cy.get('.container').should('be.visible');
        cy.get('#startQuiz').should('be.visible');

    });

    it('should display correctly on tablet', function() {
        cy.viewport(768, 1024); // Typical tablet size
        
        // Check elements, their positions, or any other specifics for tablet layout here.
        cy.get('.container').should('be.visible');
        cy.get('#startQuiz').should('be.visible');
    });

    it('should display correctly on mobile', function() {
        cy.viewport(375, 667); // Typical mobile size
        
        // Check elements, their positions, or any other specifics for mobile layout here.
        cy.get('.container').should('be.visible');
        cy.get('#startQuiz').should('be.visible');
    });

});

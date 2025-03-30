document.addEventListener('DOMContentLoaded', function() {
    // Reference to chart instances
    let macrosChart = null;
    let mealCaloriesChart = null;
    let nutrientComparisonChart = null;
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current button and content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // If switching to visualization tab, load charts
            if (tabId === 'visualization') {
                loadVisualizations();
            }
        });
    });
    
    // BMI calculation
    const calculateBmiBtn = document.getElementById('calculate-bmi');
    calculateBmiBtn.addEventListener('click', function() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        
        if (!weight || !height) {
            showError('Please enter both weight and height');
            return;
        }
        
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = 'flex';
        
        fetch('/calculate_bmi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weight, height }),
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = 'none';
            if (data.error) {
                showError(data.error);
            } else {
                document.getElementById('bmi').value = data.bmi;
            }
        })
        .catch(error => {
            loadingOverlay.style.display = 'none';
            showError('Error calculating BMI: ' + error);
        });
    });
    
    // Generate recommendations
    const generateRecommendationsBtn = document.getElementById('generate-recommendations');
    generateRecommendationsBtn.addEventListener('click', function() {
        const userData = {
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            weight: parseFloat(document.getElementById('weight').value),
            height: parseFloat(document.getElementById('height').value),
            activity_level: document.getElementById('activity-level').value,
            goal: document.getElementById('goal').value,
            vegetarian: document.getElementById('vegetarian').checked,
            vegan: document.getElementById('vegan').checked,
            low_carb: document.getElementById('low-carb').checked,
            low_fat: document.getElementById('low-fat').checked,
            high_protein: document.getElementById('high-protein').checked,
            allergies: document.getElementById('allergies').value
        };
        
        if (!userData.age || !userData.weight || !userData.height) {
            showError('Please fill in all required fields');
            return;
        }
        
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = 'flex';
        
        fetch('/generate_recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = 'none';
            if (data.error) {
                showError(data.error);
            } else {
                displayRecommendations(data);
                // Switch to recommendations tab
                document.querySelector('.tab-button[data-tab="recommendations"]').click();
            }
        })
        .catch(error => {
            loadingOverlay.style.display = 'none';
            showError('Error generating recommendations: ' + error);
        });
    });
    
    // View visualization button
    const viewVisualizationBtn = document.getElementById('view-visualization');
    viewVisualizationBtn.addEventListener('click', function() {
        document.querySelector('.tab-button[data-tab="visualization"]').click();
    });
    
    // Close error modal
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', function() {
        document.getElementById('error-modal').style.display = 'none';
    });
    
    // Helper function to show error modal
    function showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').style.display = 'block';
    }
    
    // Helper function to display recommendations
    function displayRecommendations(data) {
        // Display nutrition requirements
        const nutritionReq = data.nutrition_req;
        document.getElementById('nutrition-requirements').innerHTML = `
            <p><strong>Daily Calories:</strong> ${nutritionReq.calories} kcal</p>
            <p><strong>Protein:</strong> ${nutritionReq.protein}g</p>
            <p><strong>Carbohydrates:</strong> ${nutritionReq.carbs}g</p>
            <p><strong>Fat:</strong> ${nutritionReq.fat}g</p>
            <p><strong>Fiber:</strong> ${nutritionReq.fiber}g</p>
        `;
        
        // Display meal plan
        const mealPlan = data.meal_plan;
        
        // Helper function to create food item HTML
        function createFoodItemHTML(food) {
            return `
                <div class="food-item">
                    <h5>${food.Food_items}</h5>
                    <p>Calories: ${food.Calories} kcal | Protein: ${food.Protein}g | Carbs: ${food.Carbohydrates}g | Fat: ${food.Fats}g</p>
                </div>
            `;
        }
        
        // Display each meal
        document.getElementById('breakfast').innerHTML = mealPlan.breakfast.length > 0 
            ? mealPlan.breakfast.slice(0, 3).map(createFoodItemHTML).join('') 
            : '<p>No breakfast items available based on your preferences.</p>';
            
        document.getElementById('lunch').innerHTML = mealPlan.lunch.length > 0 
            ? mealPlan.lunch.slice(0, 3).map(createFoodItemHTML).join('') 
            : '<p>No lunch items available based on your preferences.</p>';
            
        document.getElementById('dinner').innerHTML = mealPlan.dinner.length > 0 
            ? mealPlan.dinner.slice(0, 3).map(createFoodItemHTML).join('') 
            : '<p>No dinner items available based on your preferences.</p>';
            
        document.getElementById('snacks').innerHTML = mealPlan.snacks.length > 0 
            ? mealPlan.snacks.slice(0, 3).map(createFoodItemHTML).join('') 
            : '<p>No snack items available based on your preferences.</p>';
    }
    
    // Helper function to create or update a chart
    function createOrUpdateChart(canvasId, type, data, options) {
        const canvas = document.getElementById(canvasId);
        
        // Check if a chart instance already exists for this canvas
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            // Destroy the existing chart
            existingChart.destroy();
        }
        
        // Create new chart
        return new Chart(canvas, {
            type: type,
            data: data,
            options: options
        });
    }
    
    // Load visualizations data and create charts
    function loadVisualizations() {
        fetch('/get_visualizations_data')
            .then(response => response.json())
            .then(data => {
                // Create or update macros chart
                macrosChart = createOrUpdateChart('macros-chart', 'pie', {
                    labels: data.macros.labels,
                    datasets: [{
                        data: data.macros.values,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                    }]
                }, {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                });
                
                // Create or update meal calories chart
                mealCaloriesChart = createOrUpdateChart('meal-calories-chart', 'bar', {
                    labels: data.meal_calories.labels,
                    datasets: [{
                        label: 'Calories',
                        data: data.meal_calories.values,
                        backgroundColor: '#4BC0C0',
                        borderColor: '#4BC0C0',
                        borderWidth: 1
                    }]
                }, {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Calories (kcal)'
                            }
                        }
                    }
                });
                
                // Create or update nutrient comparison chart
                nutrientComparisonChart = createOrUpdateChart('nutrient-comparison-chart', 'bar', {
                    labels: data.nutrient_comparison.nutrients,
                    datasets: [
                        {
                            label: 'Recommended',
                            data: data.nutrient_comparison.recommended,
                            backgroundColor: '#FF6384',
                            borderColor: '#FF6384',
                            borderWidth: 1
                        },
                        {
                            label: 'Actual',
                            data: data.nutrient_comparison.actual,
                            backgroundColor: '#36A2EB',
                            borderColor: '#36A2EB',
                            borderWidth: 1
                        }
                    ]
                }, {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount (g)'
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading visualization data:', error);
                showError('Failed to load visualization data: ' + error);
            });
    }
});
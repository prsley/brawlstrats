document.getElementById('inputForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Get the input value
    const inputValue = document.getElementById('userInput').value;

    // Store the value in localStorage
    localStorage.setItem('userInput', inputValue);

    // Navigate to the next page
    window.location.href = 'map.html'; // Update this with your desired next page
});
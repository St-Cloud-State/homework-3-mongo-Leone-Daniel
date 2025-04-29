// Function to submit a new application
function submitApplication() {
    const f_name = document.getElementById('f_name').value;
    const l_name = document.getElementById('l_name').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipcode = document.getElementById('zipcode').value;

    const applicationData = {
        f_name: f_name,
        l_name: l_name,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode
    };

    fetch('/api/submit_application', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('applicationResult');
        resultDiv.innerHTML = `✅ Application submitted! Your tracking ID is: <b>${data.tracking_id}</b>`;
        
        // Optionally clear the input fields
        document.getElementById('f_name').value = '';
        document.getElementById('l_name').value = '';
        document.getElementById('address').value = '';
        document.getElementById('city').value = '';
        document.getElementById('state').value = '';
        document.getElementById('zipcode').value = '';
    })
    .catch(error => {
        console.error('Error submitting application:', error);
    });
}

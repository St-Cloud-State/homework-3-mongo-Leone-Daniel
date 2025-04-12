db = db.getSiblingDB("testDB");

db.applications.insertMany([
  {
    tracking_id: "app_00001",
    f_name: "Alice",
    l_name: "Johnson",
    address: "101 Maple Street",
    city: "Minneapolis",
    state: "MN",
    zipcode: "55401",
    status: "received",
    general_notes: [],
    processing: {
      personal_details_check: [],
      credit_check: [],
      certification_check: []
    },
    acceptance_notes: [],
    rejection_reason: null
  },
  {
    tracking_id: "app_00002",
    f_name: "Bob",
    l_name: "Martinez",
    address: "88 Sunset Blvd",
    city: "Beverly Hills",
    state: "CA",
    zipcode: "90210",
    status: "processing",
    general_notes: [],
    processing: {
      personal_details_check: [],
      credit_check: [
        {
          task: "Pull credit score",
          message: "Score: 720",
          completed: true,
          timestamp: new Date()
        }
      ],
      certification_check: []
    },
    acceptance_notes: [],
    rejection_reason: null
  },
  {
    tracking_id: "app_00003",
    f_name: "Clara",
    l_name: "Nguyen",
    address: "300 5th Ave",
    city: "New York",
    state: "NY",
    zipcode: "10001",
    status: "rejected",
    general_notes: [],
    processing: {
      personal_details_check: [],
      credit_check: [],
      certification_check: []
    },
    acceptance_notes: [],
    rejection_reason: "Incomplete documents"
  }
]);

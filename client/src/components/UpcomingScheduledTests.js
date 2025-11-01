import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Badge } from '../../components/ui';

const UpcomingScheduledTests = () => {
  const [scheduledTests, setScheduledTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledTests();
  }, []);

  const fetchScheduledTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get("${API_URL}/tests/scheduled/upcoming', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledTests(data.scheduledTests);
    } catch (error) {
      console.error('Failed to fetch scheduled tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-4">
          <p className="text-gray-500">Loading scheduled tests...</p>
        </div>
      </Card>
    );
  }

  if (scheduledTests.length === 0) {
    return (
      <Card>
        <h3 className="text-xl font-bold mb-4 text-textPrimary">📅 Upcoming Scheduled Tests</h3>
        <p className="text-gray-500 text-center py-4">No scheduled tests available</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 text-textPrimary">📅 Upcoming Scheduled Tests</h3>
      <div className="space-y-3">
        {scheduledTests.map((schedule, index) => (
          <motion.div
            key={schedule._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-textPrimary">{schedule.test?.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info" size="sm">{schedule.test?.subject}</Badge>
                  <Badge variant="default" size="sm">{schedule.scheduleType.replace('-', ' ')}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{schedule.test?.duration} mins</p>
                <p className="text-sm font-semibold text-primary">{schedule.test?.totalMarks} marks</p>
              </div>
            </div>

            {/* Upcoming Dates */}
            {schedule.upcomingDates && schedule.upcomingDates.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Next available dates:</p>
                <div className="flex flex-wrap gap-2">
                  {schedule.upcomingDates.map((dateObj, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white px-3 py-1 rounded-full border border-blue-200 text-blue-700 font-medium"
                    >
                      {new Date(dateObj.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-3">
              <Link
                to={`/student/take-test/${schedule.test?._id}`}
                className="inline-block text-sm font-medium text-primary hover:text-blue-700 transition-colors"
              >
                View Test Details →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default UpcomingScheduledTests;


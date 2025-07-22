import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, BookOpen, Users, Calendar, Settings } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SchoolSchedule = () => {
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedClass, setSelectedClass] = useState('А');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const { toast } = useToast();
  
  const grades = Array.from({ length: 11 }, (_, i) => (i + 1).toString());
  const classes = ['А', 'Ә', 'Б', 'В'];
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
  const daysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  const timeSlots = [
    { period: 1, time: '14:00-14:45' },
    { period: 2, time: '14:50-15:35' },
    { period: 3, time: '15:40-16:25' },
    { period: 4, time: '16:35-17:20' },
    { period: 5, time: '17:25-18:10' },
    { period: 6, time: '18:15-19:00' },
    { period: 7, time: '19:05-19:50' }
  ];

  // Load schedule from backend
  const loadSchedule = async (grade, letter) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/school/schedules/${grade}/${letter}`);
      setSchedule(response.data.schedule);
    } catch (error) {
      // No schedule found, set empty
      setSchedule({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      });
      
      if (error.response?.status !== 404) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить расписание",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load schedule when class changes
  useEffect(() => {
    if (selectedGrade && selectedClass) {
      loadSchedule(selectedGrade, selectedClass);
    }
  }, [selectedGrade, selectedClass]);

  const getSubjectColor = (subject) => {
    const colors = {
      'Математика': 'bg-blue-100 text-blue-800 border-blue-200',
      'Ағылшын тілі': 'bg-green-100 text-green-800 border-green-200',
      'Қазақ тілі': 'bg-purple-100 text-purple-800 border-purple-200',
      'Қазақ әдебиеті': 'bg-purple-200 text-purple-900 border-purple-300',
      'Дене шынықтыру': 'bg-orange-100 text-orange-800 border-orange-200',
      'Көркем еңбек': 'bg-pink-100 text-pink-800 border-pink-200',
      'Орыс тілі': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Қазақстан тарихы': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Дүниежүзі тарихы': 'bg-amber-100 text-amber-800 border-amber-200',
      'Жаратылыстану': 'bg-teal-100 text-teal-800 border-teal-200',
      'Информатика': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Музыка': 'bg-rose-100 text-rose-800 border-rose-200',
      'Сынып сағаты': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    for (let key in colors) {
      if (subject.includes(key)) return colors[key];
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (showAdmin) {
    // Dynamically import AdminPanel
    const AdminPanel = React.lazy(() => import('./AdminPanel'));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <AdminPanel />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Мектеп кестесі
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Расписание занятий • School Schedule</p>
          
          {/* Admin button */}
          <Button 
            variant="outline" 
            onClick={() => setShowAdmin(true)}
            className="mt-4 hover:bg-purple-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Админ панель
          </Button>
        </div>

        {/* Class Selector */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              Сынып таңдау / Выбор класса
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Сынып / Класс:
                </label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-20 bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Әріп / Буква:
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-20 bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 px-4 py-2 text-lg font-semibold">
                {selectedGrade}{selectedClass} сынып
              </Badge>

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Загрузка...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5" />
              Апта кестесі / Расписание на неделю
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>14:00 - 19:50 • 45 минут сабақ / урок</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {schedule ? (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="p-4 font-semibold border-r border-blue-500">
                      <div className="text-sm">Уақыт</div>
                      <div className="text-xs opacity-90">Время</div>
                    </div>
                    {days.map((day, index) => (
                      <div key={day} className="p-4 text-center font-semibold border-r border-blue-500 last:border-r-0">
                        <div className="text-sm">{day}</div>
                        <div className="text-xs opacity-90">{daysEn[index]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Schedule Rows */}
                  {timeSlots.map((slot, timeIndex) => (
                    <div key={slot.period} className={`grid grid-cols-6 ${timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                      <div className="p-4 border-r border-gray-200 bg-blue-50">
                        <div className="font-semibold text-blue-800">{slot.period}</div>
                        <div className="text-xs text-blue-600 font-medium">{slot.time}</div>
                      </div>
                      {dayKeys.map((dayKey, dayIndex) => {
                        const subject = schedule[dayKey] && schedule[dayKey][slot.period - 1];
                        
                        return (
                          <div key={`${dayKey}-${slot.period}`} className="p-3 border-r border-gray-200 last:border-r-0 min-h-[80px]">
                            {subject ? (
                              <div className={`rounded-lg p-3 h-full border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getSubjectColor(subject)}`}>
                                <div className="text-sm font-semibold leading-tight">
                                  {subject}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center text-xs pt-4">
                                Сабақ жоқ
                                <br />
                                <span className="text-gray-300">Нет урока</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">
                  {loading ? "Загрузка расписания..." : "Расписание для этого класса не найдено"}
                </div>
                {!loading && (
                  <div className="text-sm text-gray-400 mt-2">
                    Обратитесь к администратору для добавления расписания
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        {schedule && (
          <Card className="mt-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Пәндер туралы / О предметах</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 rounded border-2 border-blue-300"></div>
                  <span>Математика</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded border-2 border-green-300"></div>
                  <span>Ағылшын тілі / Английский язык</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 rounded border-2 border-purple-300"></div>
                  <span>Қазақ тілі / Казахский язык</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-300 rounded border-2 border-purple-400"></div>
                  <span>Қазақ әдебиеті / Казахская литература</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 rounded border-2 border-orange-300"></div>
                  <span>Дене шынықтыру / Физкультура</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-200 rounded border-2 border-pink-300"></div>
                  <span>Көркем еңбек / Труд</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-200 rounded border-2 border-indigo-300"></div>
                  <span>Орыс тілі / Русский язык</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 rounded border-2 border-yellow-300"></div>
                  <span>Қазақстан тарихы / История Казахстана</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-200 rounded border-2 border-amber-300"></div>
                  <span>Дүниежүзі тарихы / Всемирная история</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-teal-200 rounded border-2 border-teal-300"></div>
                  <span>Жаратылыстану / Естествознание</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-200 rounded border-2 border-cyan-300"></div>
                  <span>Информатика</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-rose-200 rounded border-2 border-rose-300"></div>
                  <span>Музыка</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SchoolSchedule;